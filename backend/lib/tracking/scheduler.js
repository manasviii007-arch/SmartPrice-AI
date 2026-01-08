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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPriceDrops = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const prices_service_1 = require("../prices/prices.service");
// Run every day at 9:00 AM
exports.checkPriceDrops = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    console.log('Running scheduled price check...');
    try {
        const trackedSnapshot = await firebase_1.db.collection('tracked').where('active', '==', true).get();
        if (trackedSnapshot.empty) {
            console.log('No tracked products.');
            return null;
        }
        const promises = trackedSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const { userId, productId, targetPrice } = data;
            // Assuming productId is the search query or we have a way to look it up.
            // In a real app, productId might be a specific DB ID for a product which contains the name/url.
            // For this hackathon, let's assume productId IS the query string or URL.
            try {
                const prices = await (0, prices_service_1.comparePrices)(productId); // Re-run comparison
                if (!prices)
                    return;
                const cheapest = prices.cheapest;
                if (cheapest.price <= targetPrice) {
                    console.log(`Price drop alert for user ${userId}: ${productId} is now ${cheapest.price}`);
                    // Create Notification
                    await firebase_1.db.collection('notifications').add({
                        userId,
                        productId,
                        message: `Price drop! ${prices.product} is now ${cheapest.currency} ${cheapest.price} on ${cheapest.platform}`,
                        read: false,
                        type: 'PRICE_DROP',
                        createdAt: new Date().toISOString()
                    });
                    // Optional: Send FCM or Email here
                }
            }
            catch (err) {
                console.error(`Failed to check price for ${productId}`, err);
            }
        });
        await Promise.all(promises);
        console.log('Price check completed.');
    }
    catch (error) {
        console.error('Error in scheduled function:', error);
    }
    return null;
});
//# sourceMappingURL=scheduler.js.map