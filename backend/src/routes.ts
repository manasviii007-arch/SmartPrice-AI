import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import priceRoutes from './prices/prices.routes';
import aiRoutes from './ai/ai.routes';
import { trackProductEndpoint, getUserSearches } from './tracking/tracking.controller';

const router = Router();

// Auth Routes
router.use('/auth', authRoutes);

// Product Routes
router.use('/products', priceRoutes);

// AI Routes
router.use('/chat', aiRoutes);

// Tracking & User Routes
const trackingRouter = Router();
trackingRouter.post('/track', trackProductEndpoint);
router.use('/alerts', trackingRouter);

const userRouter = Router();
userRouter.get('/searches', getUserSearches);
router.use('/user', userRouter);

// Root health check
router.get('/', (req, res) => {
  res.send('Price Comparison API is running');
});

export default router;
