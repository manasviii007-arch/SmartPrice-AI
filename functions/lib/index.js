"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const generative_ai_1 = require("@google/generative-ai");
const amazon_1 = require("./prices/providers/amazon");
const flipkart_1 = require("./prices/providers/flipkart");
const mock_1 = require("./prices/providers/mock");
admin.initializeApp();
// Helper to safely get Firestore (mock if fails, e.g. no creds)
let db = null;
try {
    db = admin.firestore();
}
catch (e) {
    console.warn("Firestore init failed (likely missing credentials). Running in limited mode.");
}
const app = (0, express_1.default)();
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true })); // Allow all origins for hackathon demo; restrict in production
app.use(express_1.default.json());
const router = express_1.default.Router();
// Initialize Providers
const providers = [
    new amazon_1.AmazonProvider(),
    new flipkart_1.FlipkartProvider(),
    new mock_1.MockProvider('Croma', 'storefront'),
    new mock_1.MockProvider('Reliance Digital', 'buildings'),
    new mock_1.MockProvider('Meesho', 'shopping-bag-open'),
    new mock_1.MockProvider('Myntra', 't-shirt')
];
// Helper: Normalize Product
function normalizeProduct(listings) {
    if (listings.length === 0)
        return null;
    // Sort by price
    listings.sort((a, b) => a.price - b.price);
    const bestDeal = listings[0];
    // Mock original price if not present (usually higher)
    const originalPrice = Math.floor(bestDeal.price * 1.25);
    return {
        title: bestDeal.title,
        image: `https://source.unsplash.com/400x400/?technology,${encodeURIComponent(bestDeal.title.split(' ').slice(0, 3).join(','))}`,
        fallbackImage: `https://placehold.co/400x400/1a1a1a/white?text=${encodeURIComponent(bestDeal.title.substring(0, 20))}`,
        bestPrice: bestDeal.price,
        originalPrice: originalPrice,
        listings: listings
    };
}
// API: Compare Prices
router.post("/compare-price", async (req, res) => {
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
        const validResults = results.filter((r) => r !== null);
        const normalizedData = normalizeProduct(validResults);
        if (!normalizedData) {
            res.status(404).json({ error: "No products found" });
            return;
        }
        res.json(normalizedData);
    }
    catch (error) {
        console.error("Compare API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// API: Gemini Advice
router.post("/chat-advice", async (req, res) => {
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
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
        }
        else {
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
            }
            catch (e) {
                res.json({ verdict: responseText, score: 70 });
            }
        }
        else {
            res.json({ reply: responseText });
        }
    }
    catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "AI Error" });
    }
});
// API: Save Deal
router.post("/save-deal", async (req, res) => {
    try {
        const { userId, deal } = req.body;
        if (!userId || !deal) {
            res.status(400).json({ error: "Missing data" });
            return;
        }
        if (db) {
            await db.collection('users').doc(userId).collection('savedDeals').add(Object.assign(Object.assign({}, deal), { savedAt: admin.firestore.FieldValue.serverTimestamp() }));
            res.json({ success: true });
        }
        else {
            // Mock success if no DB
            console.warn("Firestore not initialized, mocking save");
            res.json({ success: true, mocked: true });
        }
    }
    catch (error) {
        console.error("Save Deal Error:", error);
        res.status(500).json({ error: "Database Error" });
    }
});
// API: Get History
router.get("/search-history", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({ error: "User ID required" });
            return;
        }
        if (db) {
            const snapshot = await db.collection('users').doc(String(userId)).collection('history')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();
            const history = snapshot.docs.map(doc => doc.data());
            res.json({ history });
        }
        else {
            res.json({ history: [] });
        }
    }
    catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ error: "Database Error" });
    }
});
// API: Add History
router.post("/search-history", async (req, res) => {
    try {
        const { userId, query } = req.body;
        if (!userId || !query) {
            res.status(400).json({ error: "Missing data" });
            return;
        }
        if (db) {
            await db.collection('users').doc(userId).collection('history').add({
                query,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            res.json({ success: true });
        }
        else {
            res.json({ success: true, mocked: true });
        }
    }
    catch (error) {
        res.status(500).json({ error: "Database Error" });
    }
});
// Mount the router
app.use("/api", router);
app.use("/", router);
// Export for Firebase
exports.api = functions.https.onRequest(app);
// Start Server for Render / Standalone
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
//# sourceMappingURL=index.js.map