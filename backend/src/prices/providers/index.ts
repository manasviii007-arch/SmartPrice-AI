export interface ProductPrice {
  platform: string;
  price: number;
  currency: string;
  url: string;
  title: string;
  discount?: string;
  delivery?: string;
  rating?: string;
  icon?: string;
}

export interface PriceProvider {
  name: string;
  searchProduct(query: string): Promise<ProductPrice | null>;
  getProductByUrl(url: string): Promise<ProductPrice | null>;
}
