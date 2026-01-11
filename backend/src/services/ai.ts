import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
console.log("AI Service Init - API Key present:", !!apiKey);
if (apiKey) console.log("API Key starts with:", apiKey.substring(0, 4));

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

export async function estimatePrice(query: string): Promise<number> {
    console.log(`Estimating price for: "${query}"`);

    const getFallbackPrice = (q: string) => {
        const lowerQ = q.toLowerCase();
        
        const generatePrice = (seed: string, min: number, max: number) => {
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                hash = seed.charCodeAt(i) + ((hash << 5) - hash);
            }
            const range = max - min;
            const offset = Math.abs(hash) % range;
            return min + offset;
        };

        // High End Electronics (Phones, Laptops, Premium Tech)
        if (lowerQ.match(/iphone|galaxy s|pixel|macbook|laptop|notebook|gaming|sony tv|lg tv|samsung tv|ipad|tablet/)) {
            return generatePrice(q, 30000, 150000);
        }
        // Mid Range Electronics (General Phones, Consoles, Cameras)
        if (lowerQ.match(/phone|mobile|monitor|tv|led|console|ps5|xbox|camera|dslr|lens|drone|smartwatch|watch/)) {
            return generatePrice(q, 8000, 50000);
        }
        // Appliances (Home)
        if (lowerQ.match(/fridge|refrigerator|washing machine|ac|air conditioner|microwave|oven|vacuum|purifier|fan/)) {
            return generatePrice(q, 10000, 60000);
        }
        // Audio & Accessories
        if (lowerQ.match(/airpods|buds|headphone|earphone|speaker|soundbar|bluetooth|mouse|keyboard|charger|power bank/)) {
            return generatePrice(q, 1000, 15000);
        }
        // Small Items / Fashion
        if (lowerQ.match(/case|cover|cable|adapter|pendrive|sd card|shoe|sneaker|shirt|t-shirt|jeans|bag|wallet|toy/)) {
            return generatePrice(q, 300, 5000);
        }
        
        // Generic Default for unknown items
        return generatePrice(q, 1500, 25000);
    };

    if (!model) {
        console.warn("No AI model available, using fallback hash.");
        return getFallbackPrice(query);
    }

    try {
        const prompt = `Estimate the current market price of "${query}" in India (INR) as a single number. 
        Return ONLY the number (e.g. 50000). Do not output text, currency symbols, or ranges. 
        If the product is expensive (like iPhones, laptops), ensure the price reflects reality (e.g. > 40000).`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`Gemini raw price response for "${query}":`, text);
        
        const numericText = text.replace(/[^0-9]/g, '');
        const price = parseInt(numericText);

        if (isNaN(price)) {
            console.warn(`Failed to parse price from Gemini response: "${text}"`);
            return getFallbackPrice(query);
        }

        console.log(`Parsed price for "${query}":`, price);
        return price;
    } catch (error) {
        console.error("Price estimation failed:", error);
        return getFallbackPrice(query);
    }
}

export async function getShoppingAdvice(query: string, data: any, context: 'chat' | 'analysis') {
    if (!model) {
        return context === 'chat' 
            ? { reply: "I can't provide advice without an API key." }
            : { verdict: "Unknown", score: 50 };
    }

    try {
        let prompt = "";
        
        if (context === "chat") {
             prompt = `
                You are Gemini, a shopping assistant for SmartPrice India.
                User Query: ${query}.
                Context: ${JSON.stringify(data)}.
                Keep answers short (max 2 sentences), friendly, and number-focused.
                If they ask about the current product, assume it's a good deal if the discount is > 15%.
            `;
        } else {
            prompt = `
                I am looking to buy "${query}". 
                The current lowest price found is ₹${data.bestPrice} (down from ₹${data.originalPrice}).
                Listings: ${JSON.stringify(data.listings)}.
                Act as a smart shopping assistant named Gemini.
                1. Provide a 1-sentence "Buy or Wait" verdict.
                2. Provide a "Fair Deal Score" between 0 and 100 based on the discount.
                Return JSON format: { "verdict": "string", "score": number }
            `;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (context !== "chat") {
             try {
                 const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                 const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
                 return JSON.parse(jsonStr);
             } catch (e) {
                 return { verdict: responseText, score: 70 };
             }
        } else {
            return { reply: responseText };
        }

    } catch (error) {
        console.error("Gemini Advice Error:", error);
        if (context === 'chat') {
            return { reply: "I'm having trouble connecting to the AI right now, but this product seems popular!" };
        } else {
            return { verdict: "Good Choice", score: 85 };
        }
    }
}
