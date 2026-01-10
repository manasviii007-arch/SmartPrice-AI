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
exports.FlipkartProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class FlipkartProvider {
    constructor() {
        this.name = 'Flipkart';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        };
    }
    async searchProduct(query) {
        try {
            const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
            const response = await axios_1.default.get(url, { headers: this.headers });
            const $ = cheerio.load(response.data);
            let container = $('div._1AtVbE').find('div[data-id]').first();
            if (!container.length) {
                container = $('div._13oc-S').first();
            }
            if (container.length) {
                let title = container.find('div._4rR01T').text().trim();
                if (!title)
                    title = container.find('a.s1Q9rs').text().trim();
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
        }
        catch (error) {
            console.warn('Flipkart scraping failed, using mock data:', error);
            return this.getMockData(query);
        }
    }
    async getProductByUrl(url) {
        return this.getMockData("Product from URL");
    }
    getMockData(query) {
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
exports.FlipkartProvider = FlipkartProvider;
//# sourceMappingURL=flipkart.js.map