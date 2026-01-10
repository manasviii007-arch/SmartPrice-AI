"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const router = (0, express_1.Router)();
// Protected route (optional, but good practice to know who is chatting)
// The requirements imply passing userId in body, so maybe it's open or client handles auth.
// I will apply verifyToken but allow it to work if userId is passed manually? 
// No, let's stick to requirements: POST /api/chat Body: { userId, message }
// So I won't force verifyToken on the route itself to be strict, but in a real app I would.
router.post('/', ai_controller_1.chatEndpoint);
router.post('/insight', ai_controller_1.insightEndpoint);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map