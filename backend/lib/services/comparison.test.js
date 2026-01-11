"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
const comparison_1 = require("./comparison");
const assert_1 = __importDefault(require("assert"));
console.log("Running Comparison Pipeline Tests...");
const rates = { USD: 83.0, INR: 1.0 };
// Test 1: String parsing & Basic Comparison
{
    console.log("Test 1: String parsing & Basic Comparison");
    const records = [
        { source: 'A', title: 'Item', raw_price_text: '₹1,999', url: 'u1' },
        { source: 'B', title: 'Item', raw_price_text: '₹999', url: 'u2' } // Winner
    ];
    const result = (0, comparison_1.comparePrices)(records, 'INR', rates);
    assert_1.default.strictEqual((_a = result.winner) === null || _a === void 0 ? void 0 : _a.source, 'B');
    assert_1.default.strictEqual((_b = result.winner) === null || _b === void 0 ? void 0 : _b.price_num, 999);
    console.log("PASS");
}
// Test 2: Currency Mix
{
    console.log("Test 2: Currency Mix (USD vs INR)");
    const records = [
        { source: 'US_Store', title: 'Item', raw_price_text: '$10', currency: 'USD', url: 'u1' }, // 830 INR
        { source: 'IN_Store', title: 'Item', raw_price_text: '₹900', currency: 'INR', url: 'u2' }
    ];
    const result = (0, comparison_1.comparePrices)(records, 'INR', rates);
    assert_1.default.strictEqual((_c = result.winner) === null || _c === void 0 ? void 0 : _c.source, 'US_Store');
    assert_1.default.strictEqual((_d = result.winner) === null || _d === void 0 ? void 0 : _d.price_num, 830);
    console.log("PASS");
}
// Test 3: Failure/Dirty Data
{
    console.log("Test 3: Failure/Dirty Data");
    const records = [
        { source: 'Bad1', title: 'Item', raw_price_text: 'Call for price', url: 'u1' }, // Should be excluded
        { source: 'Bad2', title: 'Item', raw_price_text: '0', url: 'u2' }, // Zero price -> excluded
        { source: 'Good', title: 'Item', raw_price_text: '500', url: 'u3' }
    ];
    const result = (0, comparison_1.comparePrices)(records, 'INR', rates);
    assert_1.default.strictEqual((_e = result.winner) === null || _e === void 0 ? void 0 : _e.source, 'Good');
    assert_1.default.strictEqual(result.all_prices.length, 1);
    console.log("PASS");
}
// Test 4: Eligibility (Stock)
{
    console.log("Test 4: Eligibility (Stock)");
    const records = [
        { source: 'OutOfStock', title: 'Item', raw_price_text: '100', in_stock: false, url: 'u1' },
        { source: 'InStock', title: 'Item', raw_price_text: '200', in_stock: true, url: 'u2' }
    ];
    const result = (0, comparison_1.comparePrices)(records, 'INR', rates);
    assert_1.default.strictEqual((_f = result.winner) === null || _f === void 0 ? void 0 : _f.source, 'InStock');
    console.log("PASS");
}
console.log("All tests passed!");
//# sourceMappingURL=comparison.test.js.map