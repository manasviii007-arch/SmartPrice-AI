
import { comparePrices, RawRecord } from './comparison';
import assert from 'assert';

console.log("Running Comparison Pipeline Tests...");

const rates = { USD: 83.0, INR: 1.0 };

// Test 1: String parsing & Basic Comparison
{
    console.log("Test 1: String parsing & Basic Comparison");
    const records: RawRecord[] = [
        { source: 'A', title: 'Item', raw_price_text: '₹1,999', url: 'u1' },
        { source: 'B', title: 'Item', raw_price_text: '₹999', url: 'u2' } // Winner
    ];
    const result = comparePrices(records, 'INR', rates);
    assert.strictEqual(result.winner?.source, 'B');
    assert.strictEqual(result.winner?.price_num, 999);
    console.log("PASS");
}

// Test 2: Currency Mix
{
    console.log("Test 2: Currency Mix (USD vs INR)");
    const records: RawRecord[] = [
        { source: 'US_Store', title: 'Item', raw_price_text: '$10', currency: 'USD', url: 'u1' }, // 830 INR
        { source: 'IN_Store', title: 'Item', raw_price_text: '₹900', currency: 'INR', url: 'u2' }
    ];
    const result = comparePrices(records, 'INR', rates);
    assert.strictEqual(result.winner?.source, 'US_Store');
    assert.strictEqual(result.winner?.price_num, 830);
    console.log("PASS");
}

// Test 3: Failure/Dirty Data
{
    console.log("Test 3: Failure/Dirty Data");
    const records: RawRecord[] = [
        { source: 'Bad1', title: 'Item', raw_price_text: 'Call for price', url: 'u1' }, // Should be excluded
        { source: 'Bad2', title: 'Item', raw_price_text: '0', url: 'u2' }, // Zero price -> excluded
        { source: 'Good', title: 'Item', raw_price_text: '500', url: 'u3' }
    ];
    const result = comparePrices(records, 'INR', rates);
    assert.strictEqual(result.winner?.source, 'Good');
    assert.strictEqual(result.all_prices.length, 1);
    console.log("PASS");
}

// Test 4: Eligibility (Stock)
{
    console.log("Test 4: Eligibility (Stock)");
    const records: RawRecord[] = [
        { source: 'OutOfStock', title: 'Item', raw_price_text: '100', in_stock: false, url: 'u1' },
        { source: 'InStock', title: 'Item', raw_price_text: '200', in_stock: true, url: 'u2' }
    ];
    const result = comparePrices(records, 'INR', rates);
    assert.strictEqual(result.winner?.source, 'InStock');
    console.log("PASS");
}

console.log("All tests passed!");
