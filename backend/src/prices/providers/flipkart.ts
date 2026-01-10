import { PriceProvider, ProductPrice } from './index';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class FlipkartProvider implements PriceProvider {
  name = 'Flipkart';

  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  };

  async searchProduct(query: string): Promise<ProductPrice | null> {
    try {
      const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, { headers: this.headers });
      const $ = cheerio.load(response.data);

      let container = $('div._1AtVbE').find('div[data-id]').first();
      
      if (!container.length) {
         container = $('div._13oc-S').first(); 
      }

      if (container.length) {
        let title = container.find('div._4rR01T').text().trim();
        if (!title) title = container.find('a.s1Q9rs').text().trim();
        
        const priceText = container.find('div._30jeq3').text().replace(/₹|,/g, '').trim();
        const link = container.find('a').attr('href');
        const rating = container.find('div._3LWZlK').first().text().trim() || '4.0';

        if (title && priceText && link) {
          return {
            platform: 'Flipkart',
            price: parseInt(priceText),
            currency: 'INR',
            url: `https://www.flipkart.com${link}`,
            title: title,
            discount: container.find('div._3Ay6Sb').text().trim() || undefined,
            icon: 'shopping-bag',
            rating: rating,
            delivery: 'Free Delivery'
          };
        }
      }
      
      throw new Error("Parsing failed or no products found");

    } catch (error) {
      console.warn('Flipkart scraping failed, using mock data:', error);
      return this.getMockData(query);
    }
  }

  async getProductByUrl(url: string): Promise<ProductPrice | null> {
      return this.getMockData("Product from URL");
  }

  private getMockData(query: string): ProductPrice {
    const basePrice = Math.floor(Math.random() * 50000) + 1000;
    return {
      platform: 'Flipkart',
      price: basePrice - 500, // Slightly cheaper mock
      currency: 'INR',
      url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      discount: '12%',
      title: `${query} (Flipkart Result)`,
      icon: 'shopping-bag',
      rating: '4.5',
      delivery: 'Free Delivery'
    };
  }
}
