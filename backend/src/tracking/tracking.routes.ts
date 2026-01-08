import { Router } from 'express';
import { trackProductEndpoint, getUserSearches } from './tracking.controller';

const router = Router();

// Track endpoint
router.post('/track', trackProductEndpoint);

// User searches (requires auth or userId)
router.get('/user/searches', getUserSearches); 
// Note: In main routes, this will be mounted under /api/alerts or /api/user depending on how we wire it.
// The user asked for GET /api/user/searches. 
// I will mount this router to handle both /alerts/* and /user/* or split them.
// To keep it simple, I'll export separate routers or handle it in index.

export default router;
