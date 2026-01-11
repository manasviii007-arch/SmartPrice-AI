import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    if (!apiKey) {
        console.log("No API Key found");
        return;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels method on genAI instance in the node SDK easily accessible 
        // without looking up docs, but we can try a simple generation on gemini-pro to see if it works
        // or just try to use the model and catch error.
        // Actually, the error message said "Call ListModels". 
        // The SDK might not expose it directly on the client, but let's try a raw fetch if needed.
        
        // Let's just try gemini-1.0-pro which is older and might be available.
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.0-pro works:", result.response.text());
    } catch (e: any) {
        console.log("gemini-1.0-pro failed:", e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro works:", result.response.text());
    } catch (e: any) {
        console.log("gemini-pro failed:", e.message);
    }
}

listModels();