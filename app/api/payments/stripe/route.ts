import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
const stripe = new Stripe(stripeKey);

/**
 * معالج الدفع عبر Stripe
 * POST /api/payments/stripe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount,
      currency,
      description,
      userId,
      planId,
      email
    } = body;

    // التحقق من البيانات
    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // تحويل المبلغ إلى cents (Stripe يتطلب أصغر وحدة نقدية)
    const amountInCents = Math.round(amount * 100);

    // إنشاء Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description: description || `Subscription: ${planId}`,
      metadata: {
        userId,
        planId,
        email
      },
      receipt_email: email,
      statement_descriptor: 'AL-HUDA SUBSCRIPTION'
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}


