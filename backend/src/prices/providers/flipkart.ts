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

      // Flipkart classes change often, these are common ones
      // _1AtVbE is container, _4rR01T is title for row layout, s1Q9rs for grid
      let container = $('div._1AtVbE').find('div[data-id]').first();
      
      if (!container.length) {
         container = $('div._13oc-S').first(); 
      }

      if (container.length) {
        let title = container.find('div._4rR01T').text().trim();
        if (!title) title = container.find('a.s1Q9rs').text().trim(); // Grid view title
        
        const priceText = container.find('div._30jeq3').text().replace(/₹|,/g, '').trim();
        const link = container.find('a').attr('href');

        if (title && priceText && link) {
          return {
            platform: 'Flipkart',
            price: parseInt(priceText),
            currency: 'INR',
            url: `https://www.flipkart.com${link}`,
            title: title,
            discount: container.find('div._3Ay6Sb').text().trim() || undefined
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
    if (!url.includes('flipkart')) return null;
    try {
      const response = await axios.get(url, { headers: this.headers });
      const $ = cheerio.load(response.data);
      
      const title = $('span.B_NuCI').text().trim();
      const priceText = $('div._30jeq3').first().text().replace(/₹|,/g, '').trim();

      if (title && priceText) {
        return {
          platform: 'Flipkart',
          price: parseInt(priceText),
          currency: 'INR',
          url: url,
          title: title
        };
      }
      throw new Error("Parsing product page failed");
    } catch (error) {
       console.warn('Flipkart URL scraping failed, using mock data');
       return this.getMockData("Product from URL");
    }
  }

  private getMockData(query: string): ProductPrice {
    return {
      platform: 'Flipkart',
      price: Math.floor(Math.random() * (75000 - 65000) + 65000),
      currency: 'INR',
      url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      discount: '12%',
      title: `${query} (Mock Flipkart Result)`
    };
  }
}
