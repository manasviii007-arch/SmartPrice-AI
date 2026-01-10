import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AmazonProvider } from "./prices/providers/amazon";
import { FlipkartProvider } from "./prices/providers/flipkart";
import { MockProvider } from "./prices/providers/mock";
import { ProductPrice } from "./prices/providers/index";

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Providers
const providers = [
    new AmazonProvider(),
    new FlipkartProvider(),
    new MockProvider('Croma', 'storefront'),
    new MockProvider('Reliance Digital', 'buildings'),
    new MockProvider('Meesho', 'shopping-bag-open'),
    new MockProvider('Myntra', 't-shirt')
];

// Helper: Normalize Product
function normalizeProduct(listings: ProductPrice[]) {
    if (listings.length === 0) return null;
    
    // Sort by price
    listings.sort((a, b) => a.price - b.price);
    
    const bestDeal = listings[0];
    // Mock original price if not present (usually higher)
    const originalPrice = Math.floor(bestDeal.price * 1.25); 

    return {
        title: bestDeal.title,
        image: `https://source.unsplash.com/400x400/?technology,${encodeURIComponent(bestDeal.title.split(' ').slice(0,3).join(','))}`,
        fallbackImage: `https://placehold.co/400x400/1a1a1a/white?text=${encodeURIComponent(bestDeal.title.substring(0, 20))}`,
        bestPrice: bestDeal.price,
        originalPrice: originalPrice,
        listings: listings
    };
}

// API: Compare Prices
app.post("/compare-price", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            res.status(400).json({ error: "Query is required" });
            return;
        }

        console.log(`Searching for: ${query}`);

        // Run searches in parallel
        const searchPromises = providers.map(p => p.searchProduct(query).catch(e => {
            console.error(`Error fetching from ${p.name}:`, e);
            return null;
        }));

        const results = await Promise.all(searchPromises);
        const validResults = results.filter((r): r is ProductPrice => r !== null);

        const normalizedData = normalizeProduct(validResults);

        if (!normalizedData) {
            res.status(404).json({ error: "No products found" });
            return;
        }

        res.json(normalizedData);

    } catch (error) {
        console.error("Compare API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Gemini Advice
app.post("/chat-advice", async (req, res) => {
    try {
        const { query, data, context } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Fallback mock if no key
            res.json({ 
                verdict: "Buy now (Mock Advice)", 
                score: 85, 
                reply: "This is a good deal based on mock data." 
            });
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let prompt = "";
        
        if (context === "chat") {
            // Chat Mode
             prompt = `
                You are Gemini, a shopping assistant for SmartPrice India.
                User Query: ${query}.
                Context: ${JSON.stringify(data)}.
                Keep answers short (max 2 sentences), friendly, and number-focused.
                If they ask about the current product, assume it's a good deal if the discount is > 15%.
            `;
        } else {
            // Analysis Mode
            prompt = `
                I am looking to buy "${query}". 
                The current lowest price found is ₹${data.bestPrice} (down from ₹${data.originalPrice}).
                Listings: ${JSON.stringify(data.listings)}.
                Act as a smart shopping assistant named Gemini.
                1. Provide a 1-sentence "Buy or Wait" verdict.
                2. Provide a "Fair Deal Score" between 0 and 100 based on the discount.
                Return JSON format: { "verdict": "string", "score": number }
            `;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Try to parse JSON if expected
        if (context !== "chat") {
             try {
                 // Extract JSON if wrapped in markdown
                 const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                 const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
                 const json = JSON.parse(jsonStr);
                 res.json(json);
             } catch (e) {
                 res.json({ verdict: responseText, score: 70 });
             }
        } else {
            res.json({ reply: responseText });
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "AI Error" });
    }
});

// API: Save Deal
app.post("/save-deal", async (req, res) => {
    try {
        const { userId, deal } = req.body;
        if (!userId || !deal) {
             res.status(400).json({ error: "Missing data" });
             return;
        }

        await db.collection('users').doc(userId).collection('savedDeals').add({
            ...deal,
            savedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Save Deal Error:", error);
        res.status(500).json({ error: "Database Error" });
    }
});

// API: Get History
app.get("/search-history", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
             res.status(400).json({ error: "User ID required" });
             return;
        }

        const snapshot = await db.collection('users').doc(String(userId)).collection('history')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const history = snapshot.docs.map(doc => doc.data());
        res.json({ history });

    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ error: "Database Error" });
    }
});

// API: Add History
app.post("/search-history", async (req, res) => {
    try {
        const { userId, query } = req.body;
        if (!userId || !query) {
             res.status(400).json({ error: "Missing data" });
             return;
        }

        await db.collection('users').doc(userId).collection('history').add({
            query,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true });
    } catch (error) {
         res.status(500).json({ error: "Database Error" });
    }
});

export const api = functions.https.onRequest(app);
