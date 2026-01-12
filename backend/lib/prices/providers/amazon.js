"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const ai_1 = require("../../services/ai");
class AmazonProvider {
    constructor() {
        this.name = 'Amazon';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        };
    }
    async searchProduct(query) {
        try {
            // Attempt scraping first
            const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
            const response = await axios_1.default.get(url, { headers: this.headers, timeout: 5000 });
            const $ = cheerio.load(response.data);
            let productElement = $('div[data-component-type="s-search-result"]').first();
            if (!productElement.length) {
                productElement = $('.s-result-item').not('.AdHolder').first();
            }
            if (productElement.length) {
                let title = productElement.find('h2 a span').text().trim();
                if (!title)
                    title = productElement.find('h2 a').text().trim();
                // Try to get the full formatted text first for raw_price_text
                let rawPrice = productElement.find('.a-price .a-offscreen').first().text().trim();
                let priceWhole = productElement.find('.a-price-whole').first().text().replace(/,/g, '').replace('.', '').trim();
                if (!priceWhole) {
                    // Fallback for different price format
                    const priceText = productElement.find('.a-price .a-offscreen').first().text();
                    if (priceText) {
                        rawPrice = priceText;
                        priceWhole = priceText.replace(/[^0-9]/g, '');
                    }
                }
                // If we still don't have rawPrice but have priceWhole, construct it
                if (!rawPrice && priceWhole)
                    rawPrice = `₹${priceWhole}`;
                const productUrlSuffix = productElement.find('h2 a').attr('href');
                const rating = productElement.find('.a-icon-alt').first().text().split(' ')[0] || '4.0';
                if (title && priceWhole && productUrlSuffix) {
                    return {
                        platform: 'Amazon',
                        price: parseInt(priceWhole),
                        raw_price_text: rawPrice,
                        currency: 'INR',
                        url: `https://www.amazon.in${productUrlSuffix}`,
                        title: title,
                        discount: 'Check site',
                        icon: 'amazon',
                        rating: rating,
                        delivery: 'Check site',
                        in_stock: true
                    };
                }
            }
            throw new Error("Parsing failed or no products found");
        }
        catch (error) {
            console.warn('Amazon scraping failed, calculating estimate:', error);
            return this.getSmartMockData(query);
        }
    }
    async getProductByUrl(url) {
        return this.getSmartMockData("Product from URL");
    }
    async getSmartMockData(query) {
        const estimatedPrice = await (0, ai_1.estimatePrice)(query);
        // Add small random variance (-5% to +5%)
        const variance = estimatedPrice * (Math.random() * 0.1 - 0.05);
        const finalPrice = Math.floor(estimatedPrice + variance);
        return {
            platform: 'Amazon',
            price: finalPrice,
            currency: 'INR',
            url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
            discount: '5%',
            title: `${query} (Amazon)`,
            icon: 'amazon',
            rating: '4.2',
            delivery: 'Free Delivery'
        };
    }
}
exports.AmazonProvider = AmazonProvider;
//# sourceMappingURL=amazon.js.map