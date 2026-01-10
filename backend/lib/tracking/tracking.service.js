"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackedProducts = exports.trackProduct = void 0;
const firebase_1 = require("../config/firebase");
const trackProduct = async (userId, productId, targetPrice) => {
    if (!firebase_1.isFirebaseConnected) {
        console.log("[MOCK] Tracking product:", { userId, productId, targetPrice });
        return { trackId: `mock_${userId}_${productId}` };
    }
    // Create or update tracked item
    const trackId = `${userId}_${productId}`;
    await firebase_1.db.collection('tracked').doc(trackId).set({
        userId,
        productId,
        targetPrice,
        active: true,
        createdAt: new Date().toISOString()
    });
    return { trackId };
};
exports.trackProduct = trackProduct;
const getTrackedProducts = async (userId) => {
    if (!firebase_1.isFirebaseConnected) {
        console.log("[MOCK] Getting tracked products for:", userId);
        return [];
    }
    const snapshot = await firebase_1.db.collection('tracked')
        .where('userId', '==', userId)
        .where('active', '==', true)
        .get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getTrackedProducts = getTrackedProducts;
//# sourceMappingURL=tracking.service.js.map