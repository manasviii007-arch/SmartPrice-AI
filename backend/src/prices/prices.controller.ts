import { Request, Response } from 'express';
import { comparePrices } from './prices.service';

export const getPriceComparison = async (req: Request, res: Response) => {
  try {
    const { q, url } = req.query;

    if (!q && !url) {
      res.status(400).json({ error: 'Missing query parameter: q (search term) or url' });
      return;
    }

    const query = (q as string) || '';
    const directUrl = (url as string) || undefined;

    const result = await comparePrices(query, directUrl);
    
    // Also save this search to user history if authenticated
    if (req.user && req.user.uid) {
       // Fire and forget save
       const userRef = db.collection('users').doc(req.user.uid);
       userRef.update({
         savedSearches: admin.firestore.FieldValue.arrayUnion({
           query: query || directUrl,
           timestamp: new Date().toISOString()
         })
       }).catch(err => console.error("Error saving search history", err));
    }

    res.json(result);
  } catch (error: any) {
    console.error('Price comparison error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare prices' });
  }
};

import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
