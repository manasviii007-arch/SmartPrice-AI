"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tracking_controller_1 = require("./tracking.controller");
const router = (0, express_1.Router)();
// Track endpoint
router.post('/track', tracking_controller_1.trackProductEndpoint);
// User searches (requires auth or userId)
router.get('/user/searches', tracking_controller_1.getUserSearches);
// Note: In main routes, this will be mounted under /api/alerts or /api/user depending on how we wire it.
// The user asked for GET /api/user/searches. 
// I will mount this router to handle both /alerts/* and /user/* or split them.
// To keep it simple, I'll export separate routers or handle it in index.
exports.default = router;
//# sourceMappingURL=tracking.routes.js.map