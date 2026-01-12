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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const admin = __importStar(require("firebase-admin"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const amazon_1 = require("./prices/providers/amazon");
const flipkart_1 = require("./prices/providers/flipkart");
const snapdeal_1 = require("./prices/providers/snapdeal");
const mock_1 = require("./prices/providers/mock");
const ai_1 = require("./services/ai");
const comparison_1 = require("./services/comparison");
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
    new snapdeal_1.SnapdealProvider(),
    new mock_1.MockProvider('Croma', 'storefront'),
    new mock_1.MockProvider('Reliance Digital', 'buildings'),
    new mock_1.MockProvider('Meesho', 'shopping-bag-open'),
    new mock_1.MockProvider('Myntra', 't-shirt')
];
// Helper: Format Response for Frontend
function formatResponse(result) {
    if (!result.winner)
        return null;
    const bestDeal = result.winner;
    // Mock original price if not present (usually higher)
    const originalPrice = Math.floor(bestDeal.price_num * 1.25);
    // Map back to ProductPrice-like structure for frontend compatibility
    // The frontend expects listings to have 'price' (number), 'platform', etc.
    // NormalizedRecord has 'price_num' which we map to 'price'
    const listings = result.all_prices.map(r => (Object.assign(Object.assign({}, r), { price: r.price_num, raw_price_text: r.raw_price_text })));
    return {
        title: bestDeal.title,
        image: `https://source.unsplash.com/400x400/?technology,${encodeURIComponent(bestDeal.title.split(' ').slice(0, 3).join(','))}`,
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
        // Convert ProductPrice to RawRecord
        const rawRecords = validResults.map(p => ({
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
        const comparisonResult = (0, comparison_1.comparePrices)(rawRecords);
        const responseData = formatResponse(comparisonResult);
        if (!responseData) {
            res.status(404).json({ error: "No products found", details: comparisonResult.logs });
            return;
        }
        res.json(responseData);
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
        const result = await (0, ai_1.getShoppingAdvice)(query, data, context);
        res.json(result);
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
// Serve Frontend static files
const frontendPath = path_1.default.join(__dirname, "../../frontend");
app.use(express_1.default.static(frontendPath));
// SPA fallback
app.get("*", (_req, res) => {
    res.sendFile(path_1.default.join(frontendPath, "index.html"));
});
// Export for Firebase (loaded only when available)
let functionsModule = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    functionsModule = require("firebase-functions");
}
catch (e) {
    functionsModule = null;
}
let api = undefined;
exports.api = api;
if (functionsModule && functionsModule.https && functionsModule.https.onRequest) {
    exports.api = api = functionsModule.https.onRequest(app);
}
// Start Server for Render / Standalone
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
//# sourceMappingURL=index.js.map