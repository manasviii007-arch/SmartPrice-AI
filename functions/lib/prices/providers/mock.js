"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProvider = void 0;
class MockProvider {
    constructor(name, icon) {
        this.name = name;
        this.icon = icon;
    }
    async searchProduct(query) {
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
    async getProductByUrl(url) {
        return this.searchProduct("Mock Product");
    }
}
exports.MockProvider = MockProvider;
//# sourceMappingURL=mock.js.map