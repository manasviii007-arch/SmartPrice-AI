
export interface RawRecord {
    source: string;
    title: string;
    raw_price_text: string;
    currency?: string;
    url: string;
    timestamp?: number;
    in_stock?: boolean;
    is_total_with_shipping?: boolean;
    [key: string]: any; // Allow other properties
}

export interface NormalizedRecord extends RawRecord {
    price_num: number;
    currency_target: string;
}

export interface ComparisonResult {
    winner: NormalizedRecord | null;
    others: NormalizedRecord[];
    all_prices: NormalizedRecord[];
    conversion_info: {
        target: string;
        rates: Record<string, number>;
    };
    flags: string[];
    logs: string[];
}

const parsePrice = (text: string): number | null => {
    // Fix: Remove 'Rs.' or 'Rs' (case insensitive) specifically to avoid dot retention
    let cleaned = (text || '').replace(/Rs\.?/gi, '');
    // Remove symbols, commas, non-digits; keep decimals
    cleaned = cleaned.replace(/[^\d.]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
};

export const comparePrices = (
    records: RawRecord[], 
    targetCurrency = 'INR', 
    rates: Record<string, number> = { USD: 83.0, INR: 1.0 }
): ComparisonResult => {
    const logs: string[] = [];
    const flags: string[] = [];

    const normalized: NormalizedRecord[] = [];

    records.forEach(rec => {
        const logPrefix = `${rec.source} ("${rec.raw_price_text}")`;
        
        // 1. Parsing
        const amount = parsePrice(rec.raw_price_text);
        if (amount === null || amount === 0) {
            logs.push(`${logPrefix} -> EXCLUDED: Parse failed or zero (${amount})`);
            return;
        }

        // 2. Currency Conversion
        const currency = rec.currency || 'INR';
        if (!(currency in rates)) {
            logs.push(`${logPrefix} -> EXCLUDED: Unknown currency (${currency})`);
            return;
        }

        const converted = amount * rates[currency];
        logs.push(`${logPrefix} -> Parsed: ${amount} ${currency} -> Converted: ${converted} ${targetCurrency}`);

        normalized.push({
            ...rec,
            price_num: converted,
            currency_target: targetCurrency
        });
    });

    // 3. Eligibility Filter
    let eligible = normalized.filter(r => {
        if (r.in_stock === false) {
            logs.push(`${r.source} -> EXCLUDED: Out of stock`);
            return false;
        }
        if (r.is_total_with_shipping === true) {
            // Logic: exclude totals with shipping unless consistently included everywhere. 
            // For now, adhering to simple rule: exclude if explicitly marked true.
            logs.push(`${r.source} -> EXCLUDED: Includes shipping (inconsistent)`);
            return false;
        }
        return true;
    });

    // 3b. Statistical Outlier Filter
    if (eligible.length >= 2) {
        // Sort by price for median calculation
        eligible.sort((a, b) => a.price_num - b.price_num);

        const mid = Math.floor(eligible.length / 2);
        const median = eligible.length % 2 !== 0 
            ? eligible[mid].price_num 
            : (eligible[mid - 1].price_num + eligible[mid].price_num) / 2;
        
        // Threshold: Price must be at least 20% of the median
        // Example: Median 70000 -> Threshold 14000. 165 is excluded.
        const threshold = median * 0.20;
        
        const filtered = eligible.filter(r => {
            if (r.price_num < threshold) {
                logs.push(`${r.source} -> EXCLUDED: Statistical outlier (Price ${r.price_num} < Threshold ${threshold})`);
                return false;
            }
            return true;
        });

        if (filtered.length > 0) {
            eligible = filtered;
        } else {
             flags.push("ALL_OUTLIERS_FILTERED");
             logs.push("All items were considered outliers! Returning original eligible set.");
        }
    }

    if (eligible.length === 0) {
        flags.push("NO_ELIGIBLE_RECORDS");
        return {
            winner: null,
            others: [],
            all_prices: normalized,
            conversion_info: { target: targetCurrency, rates },
            flags,
            logs
        };
    }

    // 4. Compare (Min Price)
    // Sort again by price (numeric)
    eligible.sort((a, b) => a.price_num - b.price_num);

    const winner = eligible[0];
    const others = eligible.slice(1);

    return {
        winner,
        others,
        all_prices: normalized,
        conversion_info: { target: targetCurrency, rates },
        flags,
        logs
    };
};
