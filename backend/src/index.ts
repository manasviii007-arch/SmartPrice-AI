import * as admin from "firebase-admin";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { AmazonProvider } from "./prices/providers/amazon";
import { FlipkartProvider } from "./prices/providers/flipkart";
import { SnapdealProvider } from "./prices/providers/snapdeal";
import { MockProvider } from "./prices/providers/mock";
import { ProductPrice } from "./prices/providers/index";
import { getShoppingAdvice, estimatePrice } from "./services/ai";
import { comparePrices, RawRecord, ComparisonResult } from "./services/comparison";

admin.initializeApp();
// Helper to safely get Firestore (mock if fails, e.g. no creds)
let db: admin.firestore.Firestore | null = null;
try {
    db = admin.firestore();
} catch (e) {
    console.warn("Firestore init failed (likely missing credentials). Running in limited mode.");
}

const app = express();

// Security Middleware
app.use(helmet()); 
app.use(cors({ origin: true })); // Allow all origins for hackathon demo; restrict in production
app.use(express.json());

const router = express.Router();

// Initialize Providers
const providers = [
    new AmazonProvider(),
    new FlipkartProvider(),
    new SnapdealProvider(),
    new MockProvider('Croma', 'storefront'),
    new MockProvider('Reliance Digital', 'buildings'),
    new MockProvider('Meesho', 'shopping-bag-open'),
    new MockProvider('Myntra', 't-shirt')
];

// Helper: Format Response for Frontend
function formatResponse(result: ComparisonResult) {
    if (!result.winner) return null;

    const bestDeal = result.winner;
    // Mock original price if not present (usually higher)
    const originalPrice = Math.floor(bestDeal.price_num * 1.25); 

    // Map back to ProductPrice-like structure for frontend compatibility
    // The frontend expects listings to have 'price' (number), 'platform', etc.
    // NormalizedRecord has 'price_num' which we map to 'price'
    const listings = result.all_prices.map(r => ({
        ...r,
        price: r.price_num, // Ensure price is the normalized number
        raw_price_text: r.raw_price_text
    }));

    return {
        title: bestDeal.title,
        image: `https://source.unsplash.com/400x400/?technology,${encodeURIComponent(bestDeal.title.split(' ').slice(0,3).join(','))}`,
        fallbackImage: `https://placehold.co/400x400/1a1a1a/white?text=${encodeURIComponent(bestDeal.title.substring(0, 20))}`,
        bestPrice: bestDeal.price_num,
        originalPrice: originalPrice,
        listings: listings,
        // Metadata for debugging/transparency
        metadata: {
            logs: result.logs,
            flags: result.flags,
            conversion: result.conversion_info
        }
    };
}

async function buildFallbackResponse(query: string) {
    const base = await estimatePrice(query);
    const original = Math.floor(base * 1.2);
    const stores = [
        { name: "Croma", icon: "storefront", adj: 0 },
        { name: "Reliance Digital", icon: "buildings", adj: 500 },
        { name: "Amazon", icon: "amazon", adj: 1000 }
    ];
    const listings = stores.map((s, i) => ({
        source: s.name,
        platform: s.name,
        title: `${query} (${s.name})`,
        price: Math.max(1, base + s.adj),
        raw_price_text: String(Math.max(1, base + s.adj)),
        currency: "INR",
        url: "#",
        in_stock: true,
        discount: i === 0 ? "10%" : undefined,
        icon: s.icon,
        rating: "4.2",
        delivery: "Free Delivery"
    })).sort((a, b) => a.price - b.price);
    return {
        title: query,
        image: `https://source.unsplash.com/400x400/?technology,${encodeURIComponent(query.split(' ').slice(0,3).join(','))}`,
        fallbackImage: `https://placehold.co/400x400/1a1a1a/white?text=${encodeURIComponent(query.substring(0, 20))}`,
        bestPrice: listings[0].price,
        originalPrice: original,
        listings
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
        const validResults = results.filter((r): r is ProductPrice => r !== null);

        // Convert ProductPrice to RawRecord
        const rawRecords: RawRecord[] = validResults.map(p => ({
            source: p.platform,
            title: p.title,
            raw_price_text: p.raw_price_text || p.price.toString(), // Fallback if raw text missing
            currency: p.currency,
            url: p.url,
            in_stock: p.in_stock,
            discount: p.discount,
            icon: p.icon,
            rating: p.rating,
            delivery: p.delivery
        }));

        const comparisonResult = comparePrices(rawRecords);
        console.log(`Compare logs: ${comparisonResult.logs.length}, flags: ${comparisonResult.flags.join(",")}`);
        console.log(`Records considered: ${rawRecords.length}`);
        const responseData = formatResponse(comparisonResult);

        if (!responseData) {
            console.warn("No products found, using fallback response");
            const fallback = await buildFallbackResponse(query);
            res.json(fallback);
            return;
        }

        res.json(responseData);

    } catch (error) {
        console.error("Compare API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Gemini Advice
router.post("/chat-advice", async (req, res) => {
    try {
        const { query, data, context } = req.body;
        const result = await getShoppingAdvice(query, data, context);
        res.json(result);
    } catch (error) {
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
            await db.collection('users').doc(userId).collection('savedDeals').add({
                ...deal,
                savedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            res.json({ success: true });
        } else {
            // Mock success if no DB
            console.warn("Firestore not initialized, mocking save");
            res.json({ success: true, mocked: true });
        }

    } catch (error) {
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
        } else {
             res.json({ history: [] });
        }

    } catch (error) {
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
        } else {
             res.json({ success: true, mocked: true });
        }

    } catch (error) {
         res.status(500).json({ error: "Database Error" });
    }
});

// API: Health
router.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "smartprice-ai", timestamp: Date.now() });
});

// API: Search (GET)
router.get("/search", async (req, res) => {
    try {
        const query = String(req.query.q || req.query.query || "").trim();
        if (!query) {
            res.status(400).json({ error: "Query is required" });
            return;
        }
        console.log(`Searching (GET) for: ${query}`);
        const searchPromises = providers.map(p => p.searchProduct(query).catch(e => {
            console.error(`Error fetching from ${p.name}:`, e);
            return null;
        }));
        const results = await Promise.all(searchPromises);
        const validResults = results.filter((r): r is ProductPrice => r !== null);
        const rawRecords: RawRecord[] = validResults.map(p => ({
            source: p.platform,
            title: p.title,
            raw_price_text: p.raw_price_text || p.price.toString(),
            currency: p.currency,
            url: p.url,
            in_stock: p.in_stock,
            discount: p.discount,
            icon: p.icon,
            rating: p.rating,
            delivery: p.delivery
        }));
        const comparisonResult = comparePrices(rawRecords);
        const responseData = formatResponse(comparisonResult);
        if (!responseData) {
            const fallback = await buildFallbackResponse(query);
            res.json(fallback);
            return;
        }
        res.json(responseData);
    } catch (error) {
        console.error("Search API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/", (_req, res) => {
    res.json({ ok: true, service: "smartprice-ai", timestamp: Date.now() });
});

// Mount the router
app.use("/api", router);
app.use("/", router);

// Serve Frontend static files (optional)
const serveFrontend = process.env.SERVE_FRONTEND === "true";
if (serveFrontend) {
    const frontendPath = path.join(__dirname, "../../frontend");
    app.use(express.static(frontendPath));
    // SPA fallback
    app.get("*", (_req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
    });
}

// Explicit root handlers to avoid platform path edge-cases
app.get("/api", (_req, res) => {
    res.json({ ok: true, service: "smartprice-ai", path: "/api" });
});
app.get("/", (_req, res) => {
    res.json({ ok: true, service: "smartprice-ai", path: "/" });
});

// Export for Firebase (loaded only when available)
let functionsModule: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    functionsModule = require("firebase-functions");
} catch (e) {
    functionsModule = null;
}
let api: any = undefined;
if (functionsModule && functionsModule.https && functionsModule.https.onRequest) {
    api = functionsModule.https.onRequest(app);
}
export { api };

// Start Server for Render / Standalone
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
