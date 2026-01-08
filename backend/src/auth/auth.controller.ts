import { Request, Response } from 'express';
import { auth, db } from '../config/firebase';
import axios from 'axios';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create user profile in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      name: name || '',
      createdAt: new Date().toISOString(),
      savedSearches: []
    });

    res.status(201).json({ 
      message: 'User created successfully', 
      userId: userRecord.uid 
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Note: Firebase Admin SDK does not support sign-in with password.
    // We must use the Firebase Auth REST API for this server-side login.
    // Ensure FIREBASE_API_KEY is set in your environment variables.
    if (!FIREBASE_API_KEY) {
       res.status(500).json({ error: 'Server configuration error: FIREBASE_API_KEY missing' });
       return;
    }

    const verifyPasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    
    const response = await axios.post(verifyPasswordUrl, {
      email,
      password,
      returnSecureToken: true
    });

    const { idToken, localId, refreshToken, expiresIn } = response.data;

    res.json({
      token: idToken,
      refreshToken,
      userId: localId,
      expiresIn
    });

  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    const errorCode = error.response?.data?.error?.message || 'Login failed';
    res.status(401).json({ error: errorCode });
  }
};
