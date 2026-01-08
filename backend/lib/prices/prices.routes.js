"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prices_controller_1 = require("./prices.controller");
// import { verifyToken } from '../auth/auth.middleware'; // Optional: if we want to protect this
const router = (0, express_1.Router)();
// Public endpoint, but could be protected. User requirements didn't strictly say it must be protected, 
// but "Middleware to verify Firebase ID token for protected routes" was listed.
// Usually search is public.
router.get('/compare', prices_controller_1.getPriceComparison);
exports.default = router;
//# sourceMappingURL=prices.routes.js.map