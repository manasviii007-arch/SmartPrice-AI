import { PriceProvider, ProductPrice } from './index';

export class MockProvider implements PriceProvider {
  name: string;
  icon: string;

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
  }

  async searchProduct(query: string): Promise<ProductPrice | null> {
    const basePrice = Math.floor(Math.random() * 50000) + 1000;
    const variance = Math.floor(Math.random() * (basePrice * 0.1)); // 10% variance
    const price = basePrice + (Math.random() > 0.5 ? variance : -variance);

    return {
      platform: this.name,
      price: price,
      currency: 'INR',
      url: '#',
      title: `${query} (${this.name})`,
      discount: '10%',
      icon: this.icon,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      delivery: Math.random() > 0.3 ? 'Free Delivery' : '+ ₹99 Shipping'
    };
  }

  async getProductByUrl(url: string): Promise<ProductPrice | null> {
    return this.searchProduct("Mock Product");
  }
}
