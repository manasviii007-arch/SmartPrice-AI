import * as functions from 'firebase-functions';
import { db } from '../config/firebase';
import { comparePrices } from '../prices/prices.service';

// Run every day at 9:00 AM
export const checkPriceDrops = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  console.log('Running scheduled price check...');
  
  try {
    const trackedSnapshot = await db.collection('tracked').where('active', '==', true).get();
    
    if (trackedSnapshot.empty) {
      console.log('No tracked products.');
      return null;
    }

    const promises = trackedSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const { userId, productId, targetPrice } = data;
      
      // Assuming productId is the search query or we have a way to look it up.
      // In a real app, productId might be a specific DB ID for a product which contains the name/url.
      // For this hackathon, let's assume productId IS the query string or URL.
      
      try {
        const prices = await comparePrices(productId); // Re-run comparison
        if (!prices) return;

        const cheapest = prices.cheapest;
        
        if (cheapest.price <= targetPrice) {
          console.log(`Price drop alert for user ${userId}: ${productId} is now ${cheapest.price}`);
          
          // Create Notification
          await db.collection('notifications').add({
            userId,
            productId,
            message: `Price drop! ${prices.product} is now ${cheapest.currency} ${cheapest.price} on ${cheapest.platform}`,
            read: false,
            type: 'PRICE_DROP',
            createdAt: new Date().toISOString()
          });
          
          // Optional: Send FCM or Email here
        }
      } catch (err) {
        console.error(`Failed to check price for ${productId}`, err);
      }
    });

    await Promise.all(promises);
    console.log('Price check completed.');
  } catch (error) {
    console.error('Error in scheduled function:', error);
  }
  return null;
});
