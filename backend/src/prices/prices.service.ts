import { db } from '../config/firebase';
import { AmazonProvider } from './providers/amazon';
import { FlipkartProvider } from './providers/flipkart';
import { ProductPrice } from './providers/index';

const providers = [new AmazonProvider(), new FlipkartProvider()];

export const comparePrices = async (query: string, directUrl?: string) => {
  // 1. Check Cache
  const cacheKey = directUrl ? `url_${Buffer.from(directUrl).toString('base64')}` : `q_${query.toLowerCase().replace(/\s+/g, '_')}`;
  // Use a hash or simpler key for actual production
  
  // Clean up key to be safe for document ID
  const safeDocId = cacheKey.replace(/\//g, '_').substring(0, 255); 
  
  const cachedDoc = await db.collection('price_cache').doc(safeDocId).get();
  
  if (cachedDoc.exists) {
    const data = cachedDoc.data();
    const now = new Date().getTime();
    const cachedTime = new Date(data?.timestamp).getTime();
    
    // 24h cache validity
    if (now - cachedTime < 24 * 60 * 60 * 1000) {
      console.log('Returning cached result for', query);
      return data as {
        product: string;
        cheapest: ProductPrice;
        all_prices: ProductPrice[];
        timestamp: string;
      };
    }
  }

  // 2. Query Providers
  const promises = providers.map(p => {
    if (directUrl) return p.getProductByUrl(directUrl);
    return p.searchProduct(query);
  });

  const results = await Promise.all(promises);
  const validResults = results.filter((r): r is ProductPrice => r !== null);

  if (validResults.length === 0) {
    throw new Error('No products found');
  }

  // 3. Determine Cheapest
  const cheapest = validResults.reduce((prev, curr) => prev.price < curr.price ? prev : curr);

  const responseData = {
    product: query || "Product from URL",
    cheapest,
    all_prices: validResults,
    timestamp: new Date().toISOString()
  };

  // 4. Save to Cache
  await db.collection('price_cache').doc(safeDocId).set(responseData);

  return responseData;
};
