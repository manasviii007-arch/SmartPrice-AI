export interface ProductPrice {
  platform: string;
  price: number;
  currency: string;
  url: string;
  discount?: string;
  title?: string;
}

export interface PriceProvider {
  name: string;
  searchProduct(query: string): Promise<ProductPrice | null>;
  getProductByUrl(url: string): Promise<ProductPrice | null>;
}
