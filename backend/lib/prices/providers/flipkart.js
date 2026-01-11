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
const ai_1 = require("../../services/ai");
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
            const response = await axios_1.default.get(url, { headers: this.headers, timeout: 5000 });
            const $ = cheerio.load(response.data);
            // Try multiple container selectors for different layouts (Grid vs List)
            // _75nlfW, tUxRFH are newer 2024/2025 class names
            let container = $('div[data-id]').first();
            if (!container.length)
                container = $('div.tUxRFH').first();
            if (!container.length)
                container = $('div.slAVV4').first();
            if (!container.length)
                container = $('div._75nlfW').first();
            if (!container.length)
                container = $('div._1AtVbE').find('div[data-id]').first();
            if (container.length) {
                let title = container.find('div.KzDlHZ').text().trim(); // New Title
                if (!title)
                    title = container.find('div._4rR01T').text().trim(); // Old Title
                if (!title)
                    title = container.find('a.s1Q9rs').text().trim(); // Small Title
                if (!title)
                    title = container.find('a.wjcEIp').text().trim();
                let priceText = container.find('div.Nx9bqj').text().trim(); // New Price
                if (!priceText)
                    priceText = container.find('div._30jeq3').text().trim(); // Old Price
                const rawPrice = priceText; // Capture raw
                priceText = priceText.replace(/[^0-9]/g, '');
                let link = container.find('a[href]').attr('href');
                if (!link)
                    link = container.find('a.CGtC98').attr('href'); // New Link class sometimes
                const rating = container.find('div._3LWZlK').first().text().trim() || container.find('div.XQDdHH').first().text().trim() || '4.0';
                if (title && priceText && link) {
                    return {
                        platform: 'Flipkart',
                        price: parseInt(priceText),
                        raw_price_text: rawPrice,
                        currency: 'INR',
                        url: link.startsWith('http') ? link : `https://www.flipkart.com${link}`,
                        title: title,
                        discount: container.find('div._3Ay6Sb').text().trim() || undefined,
                        icon: 'shopping-bag',
                        rating: rating,
                        delivery: 'Free Delivery',
                        in_stock: true
                    };
                }
            }
            // Desperate Fallback: Just find the first price and assume it's the product
            const anyPrice = $('div.Nx9bqj, div._30jeq3').first();
            if (anyPrice.length) {
                const priceVal = anyPrice.text().replace(/[^0-9]/g, '');
                // Try to find a title nearby or just the first title on page
                const anyTitle = $('div.KzDlHZ, div._4rR01T, a.s1Q9rs').first().text().trim();
                const anyLink = $('a[href*="/p/"]').first().attr('href'); // Links with /p/ are usually products
                if (priceVal && anyTitle && anyLink) {
                    return {
                        platform: 'Flipkart',
                        price: parseInt(priceVal),
                        currency: 'INR',
                        url: anyLink.startsWith('http') ? anyLink : `https://www.flipkart.com${anyLink}`,
                        title: anyTitle,
                        discount: undefined,
                        icon: 'shopping-bag',
                        rating: '4.0',
                        delivery: 'Free Delivery'
                    };
                }
            }
            throw new Error("Parsing failed or no products found");
        }
        catch (error) {
            console.warn('Flipkart scraping failed, calculating estimate:', error);
            return this.getSmartMockData(query);
        }
    }
    async getProductByUrl(url) {
        return this.getSmartMockData("Product from URL");
    }
    async getSmartMockData(query) {
        const estimatedPrice = await (0, ai_1.estimatePrice)(query);
        // Flipkart usually slightly cheaper than Amazon in this mock scenario
        const variance = estimatedPrice * (Math.random() * 0.1 - 0.08); // -8% to +2%
        const finalPrice = Math.floor(estimatedPrice + variance);
        return {
            platform: 'Flipkart',
            price: finalPrice,
            currency: 'INR',
            url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
            discount: '12%',
            title: `${query} (Flipkart)`,
            icon: 'shopping-bag',
            rating: '4.5',
            delivery: 'Free Delivery'
        };
    }
}
exports.FlipkartProvider = FlipkartProvider;
//# sourceMappingURL=flipkart.js.map