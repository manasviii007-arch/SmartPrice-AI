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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriceComparison = void 0;
const prices_service_1 = require("./prices.service");
const getPriceComparison = async (req, res) => {
    try {
        const { q, url } = req.query;
        if (!q && !url) {
            res.status(400).json({ error: 'Missing query parameter: q (search term) or url' });
            return;
        }
        const query = q || '';
        const directUrl = url || undefined;
        const result = await (0, prices_service_1.comparePrices)(query, directUrl);
        // Also save this search to user history if authenticated
        if (req.user && req.user.uid) {
            // Fire and forget save
            const userRef = firebase_1.db.collection('users').doc(req.user.uid);
            userRef.update({
                savedSearches: admin.firestore.FieldValue.arrayUnion({
                    query: query || directUrl,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.error("Error saving search history", err));
        }
        res.json(result);
    }
    catch (error) {
        console.error('Price comparison error:', error);
        res.status(500).json({ error: error.message || 'Failed to compare prices' });
    }
};
exports.getPriceComparison = getPriceComparison;
const firebase_1 = require("../config/firebase");
const admin = __importStar(require("firebase-admin"));
//# sourceMappingURL=prices.controller.js.map