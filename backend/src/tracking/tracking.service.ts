import { db, isFirebaseConnected } from '../config/firebase';

export const trackProduct = async (userId: string, productId: string, targetPrice: number) => {
  if (!isFirebaseConnected) {
    console.log("[MOCK] Tracking product:", { userId, productId, targetPrice });
    return { trackId: `mock_${userId}_${productId}` };
  }

  // Create or update tracked item
  const trackId = `${userId}_${productId}`;
  
  await db.collection('tracked').doc(trackId).set({
    userId,
    productId,
    targetPrice,
    active: true,
    createdAt: new Date().toISOString()
  });

  return { trackId };
};

export const getTrackedProducts = async (userId: string) => {
  if (!isFirebaseConnected) {
    console.log("[MOCK] Getting tracked products for:", userId);
    return [];
  }

  const snapshot = await db.collection('tracked')
    .where('userId', '==', userId)
    .where('active', '==', true)
    .get();
    
  return snapshot.docs.map(doc => doc.data());
};
