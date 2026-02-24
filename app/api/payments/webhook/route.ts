import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
const stripe = new Stripe(stripeKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_dummy_for_development';

/**
 * Webhook Handler لأحداث Stripe
 * POST /api/payments/webhook
 * 
 * يعالج الأحداث:
 * - payment_intent.succeeded (الدفع نجح)
 * - payment_intent.payment_failed (الدفع فشل)
 * - customer.subscription.created (اشتراك جديد)
 * - customer.subscription.deleted (إلغاء اشتراك)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // التحقق من أن الحدث من Stripe
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Webhook event received: ${event.type}`);

    // معالجة أنواع الأحداث المختلفة
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * معالج: الدفع نجح
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { id, amount, currency, metadata } = paymentIntent;
  const { userId, planId, email } = metadata || {};

  console.log(`✅ Payment succeeded for user ${userId}: ${amount / 100} ${currency}`);

  // TODO: حفظ في قاعدة البيانات
  // - تحديث حالة الدفع في database
  // - إنشاء اشتراك جديد
  // - إرسال تأكيد البريد الإلكتروني

  // مثال:
  // await savePaymentRecord({
  //   userId,
  //   planId,
  //   paymentId: id,
  //   amount: amount / 100,
  //   currency,
  //   email,
  //   status: 'succeeded',
  //   timestamp: new Date()
  // });
}

/**
 * معالج: الدفع فشل
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { id, amount, currency, metadata, last_payment_error } = paymentIntent;
  const { userId, email } = metadata || {};

  const errorMessage = last_payment_error?.message || 'Unknown error';
  console.error(`❌ Payment failed for user ${userId}: ${errorMessage}`);

  // TODO: حفظ في قاعدة البيانات
  // - تسجيل الفشل
  // - إرسال بريد إخفاق الدفع
  // - إعادة محاولة

  // مثال:
  // await logFailedPayment({
  //   userId,
  //   paymentId: id,
  //   amount: amount / 100,
  //   currency,
  //   email,
  //   error: errorMessage,
  //   timestamp: new Date()
  // });

  // إرسال بريد إلى المستخدم
  // await sendEmail({
  //   to: email,
  //   subject: 'Payment Failed - Try Again',
  //   template: 'payment_failed',
  //   data: { amount: amount / 100, error: errorMessage }
  // });
}

/**
 * معالج: اشتراك جديد
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { id, customer, metadata, items, status } = subscription;

  console.log(`🆕 Subscription created: ${id}`);

  // TODO: حفظ الاشتراك في قاعدة البيانات
  // - تسجيل الاشتراك
  // - ربط مع المستخدم
  // - تفعيل الميزات

  // مثال:
  // const plan = items.data[0]?.price?.metadata?.plan || 'basic';
  // await createSubscription({
  //   subscriptionId: id,
  //   customerId: customer,
  //   plan,
  //   status,
  //   startDate: new Date(),
  //   renewalDate: new Date(subscription.current_period_end * 1000)
  // });
}

/**
 * معالج: حذف اشتراك
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { id, customer } = subscription;

  console.log(`🗑️ Subscription deleted: ${id}`);

  // TODO: حفظ في قاعدة البيانات
  // - تحديث حالة الاشتراك
  // - تعطيل الميزات
  // - إرسال بريد تأكيد

  // مثال:
  // await cancelSubscription({
  //   subscriptionId: id,
  //   customerId: customer,
  //   cancelledAt: new Date(),
  //   reason: 'customer_requested'
  // });
}

/**
 * معالج: دفع الفاتورة نجح
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const { id, customer, amount_paid, currency, description } = invoice;

  console.log(`💳 Invoice payment succeeded: ${id}`);

  // TODO: تحديث سجل الدفع
  // - تسجيل الدفعة الجديدة
  // - إرسال فاتورة البريد الإلكتروني
  // - تحديث تاريخ التجديد

  // مثال:
  // await updateInvoiceRecord({
  //   invoiceId: id,
  //   customerId: customer,
  //   amount: amount_paid / 100,
  //   currency,
  //   paidAt: new Date(),
  //   status: 'paid'
  // });

  // إرسال الفاتورة بالبريد
  // await sendEmail({
  //   to: invoice.customer_email,
  //   subject: 'Your Invoice',
  //   template: 'invoice',
  //   attachments: [{ url: invoice.invoice_pdf }]
  // });
}
