"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePrices = void 0;
const firebase_1 = require("../config/firebase");
const amazon_1 = require("./providers/amazon");
const flipkart_1 = require("./providers/flipkart");
const providers = [new amazon_1.AmazonProvider(), new flipkart_1.FlipkartProvider()];
const comparePrices = async (query, directUrl) => {
    // 1. Check Cache
    const cacheKey = directUrl ? `url_${Buffer.from(directUrl).toString('base64')}` : `q_${query.toLowerCase().replace(/\s+/g, '_')}`;
    // Use a hash or simpler key for actual production
    // Clean up key to be safe for document ID
    const safeDocId = cacheKey.replace(/\//g, '_').substring(0, 255);
    if (firebase_1.isFirebaseConnected) {
        try {
            const cachedDoc = await firebase_1.db.collection('price_cache').doc(safeDocId).get();
            if (cachedDoc.exists) {
                const data = cachedDoc.data();
                const now = new Date().getTime();
                const cachedTime = new Date(data === null || data === void 0 ? void 0 : data.timestamp).getTime();
                // 24h cache validity
                if (now - cachedTime < 24 * 60 * 60 * 1000) {
                    console.log('Returning cached result for', query);
                    return data;
                }
            }
        }
        catch (error) {
            console.warn("Cache read failed (ignoring):", error);
        }
    }
    // 2. Query Providers
    const promises = providers.map(p => {
        if (directUrl)
            return p.getProductByUrl(directUrl);
        return p.searchProduct(query);
    });
    const results = await Promise.all(promises);
    const validResults = results.filter((r) => r !== null);
    if (validResults.length === 0) {
        throw new Error('No products found');
    }
    // 3. Determine Cheapest
    const cheapest = validResults.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
    const responseData = {
        product: query || "Product from URL",
        cheapest,
        all_prices: validResults,
        timestamp: new Date().toISOString()
    };
    // 4. Save to Cache
    try {
        await firebase_1.db.collection('price_cache').doc(safeDocId).set(responseData);
    }
    catch (error) {
        console.warn("Cache write failed (ignoring):", error);
    }
    return responseData;
};
exports.comparePrices = comparePrices;
//# sourceMappingURL=prices.service.js.map