"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const prices_routes_1 = __importDefault(require("./prices/prices.routes"));
const ai_routes_1 = __importDefault(require("./ai/ai.routes"));
const tracking_controller_1 = require("./tracking/tracking.controller");
const router = (0, express_1.Router)();
// Auth Routes
router.use('/auth', auth_routes_1.default);
// Product Routes
router.use('/products', prices_routes_1.default);
// AI Routes
router.use('/chat', ai_routes_1.default);
// Tracking & User Routes
const trackingRouter = (0, express_1.Router)();
trackingRouter.post('/track', tracking_controller_1.trackProductEndpoint);
router.use('/alerts', trackingRouter);
const userRouter = (0, express_1.Router)();
userRouter.get('/searches', tracking_controller_1.getUserSearches);
router.use('/user', userRouter);
// Root health check
router.get('/', (req, res) => {
    res.send('Price Comparison API is running');
});
exports.default = router;
//# sourceMappingURL=routes.js.map