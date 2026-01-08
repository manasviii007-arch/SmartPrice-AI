"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatEndpoint = void 0;
const ai_service_1 = require("./ai.service");
const chatEndpoint = async (req, res) => {
    var _a;
    try {
        const { userId, message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        // userId is optional in body if we use auth middleware, but per requirements it's in body.
        // We can also fallback to req.user.uid if available.
        const uid = userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid) || 'anonymous';
        const reply = await (0, ai_service_1.handleChat)(uid, message);
        res.json({ reply });
    }
    catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
};
exports.chatEndpoint = chatEndpoint;
//# sourceMappingURL=ai.controller.js.map