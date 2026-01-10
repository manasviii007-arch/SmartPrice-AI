import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

export let isFirebaseConnected = false;

// Safer initialization for local dev without credentials
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'smartprice-ai'
    });
    console.log("Firebase initialized with Application Default Credentials.");
    isFirebaseConnected = true;
  } catch (e) {
    console.warn("Failed to initialize Firebase with credentials:", e);
  }
} else {
  console.warn("No GOOGLE_APPLICATION_CREDENTIALS found. Initializing Firebase in Mock Mode.");
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'demo-project' // Dummy project ID
    });
    // isFirebaseConnected remains false
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging(); // For notifications
