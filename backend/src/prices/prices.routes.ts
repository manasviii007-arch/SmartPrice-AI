import { Router } from 'express';
import { getPriceComparison } from './prices.controller';
// import { verifyToken } from '../auth/auth.middleware'; // Optional: if we want to protect this

const router = Router();

// Public endpoint, but could be protected. User requirements didn't strictly say it must be protected, 
// but "Middleware to verify Firebase ID token for protected routes" was listed.
// Usually search is public.
router.get('/compare', getPriceComparison);

export default router;
