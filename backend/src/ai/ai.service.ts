import { geminiModel } from '../config/gemini';
import { comparePrices } from '../prices/prices.service';

import { ProductPrice } from '../prices/providers/index';

export const handleChat = async (userId: string, message: string) => {
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
};
