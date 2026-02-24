import * as functions from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
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

// Export the Express API function
export const api = functions.https.onRequest(app);

// Firestore trigger: notify admin log when a new message arrives
export const onNewMessage = onDocumentCreated('messages/{messageId}', async (event) => {
  const snap = event.data;
  if (!snap) return null;

  const data = snap.data();

  // Only process messages from users (not admin replies)
  if (!data || data.senderRole !== 'user') {
    return null;
  }

  const db = admin.firestore();

  // Write a notification record for the admin panel to pick up in real-time
  await db.collection('adminNotifications').add({
    type: 'new_message',
    messageId: event.params.messageId,
    userId: data.userId || '',
    text: data.text || '',
    messageType: data.messageType || 'text',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });

  return null;
});

// Firestore trigger: notify admin when a new voice call is created
export const onNewVoiceCall = onDocumentCreated('voiceCalls/{callId}', async (event) => {
  const snap = event.data;
  if (!snap) return null;

  const data = snap.data();

  if (!data) {
    return null;
  }

  const db = admin.firestore();

  // Write a notification record for the admin panel
  await db.collection('adminNotifications').add({
    type: 'new_voice_call',
    callId: event.params.callId,
    userId: data.userId || '',
    roomName: data.roomName || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });

  return null;
});
