"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProvider = void 0;
const ai_1 = require("../../services/ai");
class MockProvider {
    constructor(name, icon) {
        this.name = name;
        this.icon = icon;
    }
    async searchProduct(query) {
        const estimatedPrice = await (0, ai_1.estimatePrice)(query);
        const variance = estimatedPrice * (Math.random() * 0.2 - 0.1); // -10% to +10%
        const price = Math.floor(estimatedPrice + variance);
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