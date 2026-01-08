import { Request, Response } from 'express';
import { trackProduct, getTrackedProducts } from './tracking.service';
import { db } from '../config/firebase';

export const trackProductEndpoint = async (req: Request, res: Response) => {
  try {
    const { userId, productId, targetPrice } = req.body;

    if (!userId || !productId || !targetPrice) {
      res.status(400).json({ error: 'userId, productId, and targetPrice are required' });
      return;
    }

    const result = await trackProduct(userId, productId, targetPrice);
    res.json({ message: 'Tracking enabled', ...result });
  } catch (error: any) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: error.message || 'Failed to track product' });
  }
};

export const getUserSearches = async (req: Request, res: Response) => {
  try {
    // This endpoint returns previous queries and tracked products
    // We assume the user is identified via query param or auth token.
    // The requirements didn't specify input, but typically it's the authenticated user.
    
    // Check if userId is passed in query or body (for testing) or use req.user from middleware
    const userId = (req.query.userId as string) || (req.user as any)?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User ID required (via query param userId or Auth token)' });
      return;
    }

    // 1. Get User Profile (for saved searches)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const savedSearches = userData?.savedSearches || [];

    // 2. Get Tracked Products
    const tracked = await getTrackedProducts(userId);

    res.json({
      savedSearches,
      trackedProducts: tracked
    });

  } catch (error: any) {
    console.error('Get User Searches error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user data' });
  }
};
