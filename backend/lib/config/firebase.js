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
exports.messaging = exports.auth = exports.db = exports.isFirebaseConnected = void 0;
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.isFirebaseConnected = false;
// Safer initialization for local dev without credentials
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID || 'smartprice-ai'
        });
        console.log("Firebase initialized with Application Default Credentials.");
        exports.isFirebaseConnected = true;
    }
    catch (e) {
        console.warn("Failed to initialize Firebase with credentials:", e);
    }
}
else {
    console.warn("No GOOGLE_APPLICATION_CREDENTIALS found. Initializing Firebase in Mock Mode.");
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: 'demo-project' // Dummy project ID
        });
        // isFirebaseConnected remains false
    }
}
exports.db = admin.firestore();
exports.auth = admin.auth();
exports.messaging = admin.messaging(); // For notifications
//# sourceMappingURL=firebase.js.map