import { geminiModel } from '../config/gemini';
import { comparePrices } from '../prices/prices.service';

import { ProductPrice } from '../prices/providers/index';

export const handleChat = async (userId: string, message: string) => {
  try {
    // 1. Identify Intent & Extract Product
    // We ask Gemini to extract the product name if it's a shopping query.
    const extractionPrompt = `
      Analyze the following user message: "${message}"
      If the user is asking for a product price or deal, extract the product name.
      If the user is just saying hello or asking general questions, return "NO_SEARCH".
      Output ONLY the product name or "NO_SEARCH". Do not add any other text.
    `;

    const extractionResult = await geminiModel.generateContent(extractionPrompt);
    const extractionResponse = extractionResult.response;
    const intent = extractionResponse.text().trim();

    let context = "";
    
    if (intent !== "NO_SEARCH") {
      console.log(`Detected product search for: ${intent}`);
      try {
        const prices = await comparePrices(intent);
        // Simplify data for token efficiency
        if (prices) {
          const summary = {
            product: prices.product,
            cheapest: prices.cheapest,
            others: prices.all_prices.map((p: ProductPrice) => ({ platform: p.platform, price: p.price }))
          };
          context = `Here is the real-time pricing data found: ${JSON.stringify(summary)}`;
        } else {
          context = "No pricing data found.";
        }
      } catch (error) {
        console.error("Price search failed:", error);
        context = "Attempted to search for prices but found no results.";
      }
    }

    // 2. Generate Response
    const systemPrompt = `
      You are PriceBot, an assistant that helps users find the cheapest deals and compare prices.
      
      User Message: "${message}"
      
      Context (Pricing Data):
      ${context}
      
      Instructions:
      - If pricing data is present, answer the user's question using that data.
      - Be friendly and concise.
      - Highlight the cheapest option explicitly.
      - Calculate the percentage difference if possible.
      - If no pricing data is relevant or found, just answer politely.
      - Example response: "Cheapest AirPods Pro (2nd Gen) are ₹22,999 on Flipkart, about 7% cheaper than Amazon."
      - Optionally suggest: "Do you want to track this product for price drops?"
    `;

    const chatResult = await geminiModel.generateContent(systemPrompt);
    const response = chatResult.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat failed:", error);
    return "I'm having trouble connecting to my AI brain right now (API Error), but you can still use the search bar to find the best prices!";
  }
};

export const generateInsight = async (query: string, currentPrice: number, originalPrice: number) => {
  try {
    const prompt = `
    I am looking to buy "${query}". 
    The current lowest price found is ₹${currentPrice} (down from ₹${originalPrice}).
    Act as a smart shopping assistant named Gemini.
    1. Provide a 1-sentence "Buy or Wait" verdict.
    2. Provide a "Fair Deal Score" between 0 and 100 based on the discount.
    Return JSON format: { "verdict": "string", "score": number }
    Do not use Markdown. Return raw JSON only.
  `;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up if markdown code blocks are returned
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse insight JSON", e);
      return { verdict: "Good deal based on market data.", score: 85 };
    }
  } catch (error) {
    console.error("Gemini API failed, using fallback insight:", error);

    const discount = originalPrice > 0 ? ((originalPrice - currentPrice) / originalPrice) * 100 : 0;
    let verdict = "Price is stable.";
    let score = 50;

    if (discount > 20) {
      verdict = "Great price! It's significantly discounted.";
      score = 90;
    } else if (discount > 10) {
      verdict = "Good deal, better than usual.";
      score = 75;
    } else {
      verdict = "Standard market price. You can buy if needed.";
      score = 60;
    }

    return { verdict, score };
  }
};
