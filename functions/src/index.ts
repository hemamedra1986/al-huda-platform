import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Stripe webhook
app.post('/api/payments/webhook', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    
    // Log webhook event
    await db.collection('webhooks').add({
      type: 'stripe',
      event: req.body.type,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: req.body
    });
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Translate endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLang = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    res.status(200).json({ 
      original: text,
      translated: text,
      language: targetLang
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Create payment intent
app.post('/api/payments/create-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    res.status(200).json({
      clientSecret: 'temp_secret_' + Date.now(),
      amount,
      currency
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Export the function
export const api = functions.https.onRequest(app);
