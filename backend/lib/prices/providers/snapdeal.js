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
exports.SnapdealProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const ai_1 = require("../../services/ai");
class SnapdealProvider {
    constructor() {
        this.name = 'Snapdeal';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        };
    }
    async searchProduct(query) {
        try {
            const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}&sort=rlvncy`;
            const response = await axios_1.default.get(url, { headers: this.headers, timeout: 5000 });
            const $ = cheerio.load(response.data);
            const productElement = $('.product-tuple-listing').first();
            if (productElement.length) {
                const title = productElement.find('.product-title').text().trim();
                const priceText = productElement.find('.product-price').text().trim();
                const priceWhole = priceText.replace(/[^0-9]/g, '');
                const productUrl = productElement.find('a.dp-widget-link').attr('href');
                const ratingStyle = productElement.find('.filled-stars').attr('style'); // width: 80%
                let rating = '4.0';
                if (ratingStyle) {
                    const width = parseFloat(ratingStyle.replace('width:', '').replace('%', ''));
                    rating = (width / 20).toFixed(1);
                }
                if (title && priceWhole && productUrl) {
                    return {
                        platform: 'Snapdeal',
                        price: parseInt(priceWhole),
                        raw_price_text: priceText,
                        currency: 'INR',
                        url: productUrl,
                        title: title,
                        discount: productElement.find('.product-discount').text().trim() || undefined,
                        icon: 'shopping-bag', // Snapdeal icon isn't standard in lucide/material, using generic
                        rating: rating,
                        delivery: 'Check site',
                        in_stock: true
                    };
                }
            }
            throw new Error("Parsing failed or no products found");
        }
        catch (error) {
            console.warn('Snapdeal scraping failed, calculating estimate:', error);
            return this.getSmartMockData(query);
        }
    }
    async getProductByUrl(url) {
        return this.getSmartMockData("Product from URL");
    }
    async getSmartMockData(query) {
        const estimatedPrice = await (0, ai_1.estimatePrice)(query);
        // Snapdeal often has good deals
        const variance = estimatedPrice * (Math.random() * 0.15 - 0.10); // -10% to +5%
        const finalPrice = Math.floor(estimatedPrice + variance);
        return {
            platform: 'Snapdeal',
            price: finalPrice,
            currency: 'INR',
            url: `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}`,
            discount: '15%',
            title: `${query} (Snapdeal)`,
            icon: 'shopping-bag',
            rating: '4.1',
            delivery: 'Free Delivery'
        };
    }
}
exports.SnapdealProvider = SnapdealProvider;
//# sourceMappingURL=snapdeal.js.map