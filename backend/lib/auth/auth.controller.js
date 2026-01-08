"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const firebase_1 = require("../config/firebase");
const axios_1 = __importDefault(require("axios"));
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // 1. Create user in Firebase Auth
        const userRecord = await firebase_1.auth.createUser({
            email,
            password,
            displayName: name,
        });
        // 2. Create user profile in Firestore
        await firebase_1.db.collection('users').doc(userRecord.uid).set({
            email: userRecord.email,
            name: name || '',
            createdAt: new Date().toISOString(),
            savedSearches: []
        });
        res.status(201).json({
            message: 'User created successfully',
            userId: userRecord.uid
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Note: Firebase Admin SDK does not support sign-in with password.
        // We must use the Firebase Auth REST API for this server-side login.
        // Ensure FIREBASE_API_KEY is set in your environment variables.
        if (!FIREBASE_API_KEY) {
            res.status(500).json({ error: 'Server configuration error: FIREBASE_API_KEY missing' });
            return;
        }
        const verifyPasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
        const response = await axios_1.default.post(verifyPasswordUrl, {
            email,
            password,
            returnSecureToken: true
        });
        const { idToken, localId, refreshToken, expiresIn } = response.data;
        res.json({
            token: idToken,
            refreshToken,
            userId: localId,
            expiresIn
        });
    }
    catch (error) {
        console.error('Login error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        const errorCode = ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Login failed';
        res.status(401).json({ error: errorCode });
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map