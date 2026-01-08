"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSearches = exports.trackProductEndpoint = void 0;
const tracking_service_1 = require("./tracking.service");
const firebase_1 = require("../config/firebase");
const trackProductEndpoint = async (req, res) => {
    try {
        const { userId, productId, targetPrice } = req.body;
        if (!userId || !productId || !targetPrice) {
            res.status(400).json({ error: 'userId, productId, and targetPrice are required' });
            return;
        }
        const result = await (0, tracking_service_1.trackProduct)(userId, productId, targetPrice);
        res.json(Object.assign({ message: 'Tracking enabled' }, result));
    }
    catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ error: error.message || 'Failed to track product' });
    }
};
exports.trackProductEndpoint = trackProductEndpoint;
const getUserSearches = async (req, res) => {
    var _a;
    try {
        // This endpoint returns previous queries and tracked products
        // We assume the user is identified via query param or auth token.
        // The requirements didn't specify input, but typically it's the authenticated user.
        // Check if userId is passed in query or body (for testing) or use req.user from middleware
        const userId = req.query.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid);
        if (!userId) {
            res.status(401).json({ error: 'User ID required (via query param userId or Auth token)' });
            return;
        }
        // 1. Get User Profile (for saved searches)
        const userDoc = await firebase_1.db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const savedSearches = (userData === null || userData === void 0 ? void 0 : userData.savedSearches) || [];
        // 2. Get Tracked Products
        const tracked = await (0, tracking_service_1.getTrackedProducts)(userId);
        res.json({
            savedSearches,
            trackedProducts: tracked
        });
    }
    catch (error) {
        console.error('Get User Searches error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user data' });
    }
};
exports.getUserSearches = getUserSearches;
//# sourceMappingURL=tracking.controller.js.map