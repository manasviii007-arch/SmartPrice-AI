import { Request, Response } from 'express';
import { handleChat, generateInsight } from './ai.service';

export const chatEndpoint = async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // userId is optional in body if we use auth middleware, but per requirements it's in body.
    // We can also fallback to req.user.uid if available.
    const uid = userId || (req.user as any)?.uid || 'anonymous';

    const reply = await handleChat(uid, message);

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
};

export const insightEndpoint = async (req: Request, res: Response) => {
  try {
    const { query, currentPrice, originalPrice } = req.body;
    
    if (!query || !currentPrice) {
       res.status(400).json({ error: "Missing parameters" });
       return;
    }

    const result = await generateInsight(query, currentPrice, originalPrice || currentPrice);
    res.json(result);
  } catch (error: any) {
    console.error('Insight error:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
};
