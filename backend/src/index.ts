import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { checkPriceDrops } from './tracking/scheduler';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/api', routes);

// Export Express App as a Cloud Function
export const api = functions.https.onRequest(app);

// Export Scheduled Function
export const scheduledPriceCheck = checkPriceDrops;
