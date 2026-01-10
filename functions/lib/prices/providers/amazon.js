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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
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
            const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
            const response = await axios_1.default.get(url, { headers: this.headers });
            const $ = cheerio.load(response.data);
            let productElement = $('div[data-component-type="s-search-result"]').first();
            if (!productElement.length) {
                productElement = $('.s-result-item').first();
            }
            if (productElement.length) {
                const title = productElement.find('h2 a span').text().trim();
                const priceWhole = productElement.find('.a-price-whole').first().text().replace(/,/g, '').trim();
                const productUrlSuffix = productElement.find('h2 a').attr('href');
                const rating = productElement.find('.a-icon-alt').first().text().split(' ')[0] || '4.0';
                if (title && priceWhole && productUrlSuffix) {
                    return {
                        platform: 'Amazon',
                        price: parseInt(priceWhole),
                        currency: 'INR',
                        url: `https://www.amazon.in${productUrlSuffix}`,
                        title: title,
                        discount: 'Check site',
                        icon: 'amazon',
                        rating: rating,
                        delivery: 'Check site'
                    };
                }
            }
            throw new Error("Parsing failed or no products found");
        }
        catch (error) {
            console.warn('Amazon scraping failed, using mock data:', error);
            return this.getMockData(query);
        }
    }
    async getProductByUrl(url) {
        // Basic implementation or fallback to mock
        return this.getMockData("Product from URL");
    }
    getMockData(query) {
        const basePrice = Math.floor(Math.random() * 50000) + 1000;
        return {
            platform: 'Amazon',
            price: basePrice,
            currency: 'INR',
            url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
            discount: '5%',
            title: `${query} (Amazon Result)`,
            icon: 'amazon',
            rating: '4.2',
            delivery: 'Free Delivery'
        };
    }
}
exports.AmazonProvider = AmazonProvider;
//# sourceMappingURL=amazon.js.map