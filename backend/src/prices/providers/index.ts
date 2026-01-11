export interface ProductPrice {
  platform: string;
  price: number;
  raw_price_text?: string; // Added for robust pipeline
  currency: string;
  url: string;
  title: string;
  discount?: string;
  delivery?: string;
  rating?: string;
  icon?: string;
  in_stock?: boolean;
}

export interface PriceProvider {
  name: string;
  searchProduct(query: string): Promise<ProductPrice | null>;
  getProductByUrl(url: string): Promise<ProductPrice | null>;
}
