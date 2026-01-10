import { Router } from 'express';
import { chatEndpoint, insightEndpoint } from './ai.controller';

const router = Router();

// Protected route (optional, but good practice to know who is chatting)
// The requirements imply passing userId in body, so maybe it's open or client handles auth.
// I will apply verifyToken but allow it to work if userId is passed manually? 
// No, let's stick to requirements: POST /api/chat Body: { userId, message }
// So I won't force verifyToken on the route itself to be strict, but in a real app I would.
router.post('/', chatEndpoint);
router.post('/insight', insightEndpoint);

export default router;
