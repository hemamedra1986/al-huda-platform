import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
const stripe = new Stripe(stripeKey);

/**
 * التحقق من حالة الدفع
 * GET /api/payments/stripe/[paymentIntentId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      email: paymentIntent.receipt_email,
      created: new Date(paymentIntent.created * 1000),
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Stripe retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment' },
      { status: 500 }
    );
  }
}
