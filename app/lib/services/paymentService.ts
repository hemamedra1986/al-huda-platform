/**
 * خدمة الدفع المتعددة
 * دعم Stripe, PayPal, التحويل البنكي
 */

export type PaymentMethod = 'stripe' | 'paypal' | 'bank-transfer' | 'apple-pay' | 'google-pay';

export type SubscriptionPlan = 'basic' | 'professional' | 'advanced' | 'enterprise';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  method: PaymentMethod;
  userId: string;
  planId: SubscriptionPlan;
  createdAt: Date;
  expiresAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
  period: { start: Date; end: Date };
  status: 'paid' | 'pending' | 'overdue';
  pdfUrl: string;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'paused' | 'canceled';
  autoRenew: boolean;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  paymentMethod: PaymentMethod;
  currency: string;
}

/**
 * معلومات الخطط والأسعار بعملات متعددة
 */
export const planPrices = {
  SAR: {
    basic: 49,
    professional: 99,
    advanced: 149,
    enterprise: 299
  },
  USD: {
    basic: 13,
    professional: 26,
    advanced: 40,
    enterprise: 80
  },
  EUR: {
    basic: 12,
    professional: 24,
    advanced: 36,
    enterprise: 72
  },
  AED: {
    basic: 47,
    professional: 95,
    advanced: 143,
    enterprise: 287
  },
  EGP: {
    basic: 195,
    professional: 390,
    advanced: 585,
    enterprise: 1170
  },
  GBP: {
    basic: 11,
    professional: 21,
    advanced: 32,
    enterprise: 64
  },
  JPY: {
    basic: 1400,
    professional: 2800,
    advanced: 4200,
    enterprise: 8400
  },
  CNY: {
    basic: 85,
    professional: 170,
    advanced: 255,
    enterprise: 510
  }
};

/**
 * ميزات كل خطة
 */
export const planFeatures = {
  basic: {
    name: 'الأساسي',
    courses: 4,
    consultations: 4,
    voiceRooms: true,
    translation: false,
    recordingHours: 5,
    storage: '10GB',
    support: 'email'
  },
  professional: {
    name: 'المحترف',
    courses: 'unlimited',
    consultations: 'unlimited',
    voiceRooms: true,
    translation: true,
    recordingHours: 'unlimited',
    storage: '100GB',
    support: 'chat'
  },
  advanced: {
    name: 'متقدم',
    courses: 'unlimited',
    consultations: 'unlimited',
    voiceRooms: true,
    translation: true,
    recordingHours: 'unlimited',
    storage: '1TB',
    support: 'phone',
    analytics: true,
    customBranding: true
  },
  enterprise: {
    name: 'مؤسسي',
    courses: 'unlimited',
    consultations: 'unlimited',
    voiceRooms: true,
    translation: true,
    recordingHours: 'unlimited',
    storage: '5TB',
    support: 'dedicated',
    analytics: true,
    customBranding: true,
    api: true,
    sso: true
  }
};

/**
 * إنشاء نية دفع جديدة
 */
export async function createPaymentIntent(
  userId: string,
  plan: SubscriptionPlan,
  currency: string,
  method: PaymentMethod
): Promise<PaymentIntent> {
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, plan, currency, method })
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return await response.json();
}

/**
 * معالجة دفعة Stripe
 */
export async function processStripePayment(
  paymentIntentId: string,
  cardToken: string
): Promise<{ success: boolean; transactionId: string }> {
  const response = await fetch('/api/payments/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId, cardToken })
  });

  if (!response.ok) {
    throw new Error('Stripe payment failed');
  }

  return await response.json();
}

/**
 * معالجة دفعة PayPal
 */
export async function processPayPalPayment(
  amount: number,
  currency: string,
  planId: string,
  userId: string,
  description = `Subscription: ${planId}`
): Promise<{ orderId: string; status: string }> {
  const response = await fetch('/api/payments/paypal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-order',
      amount,
      currency,
      planId,
      userId,
      description,
    })
  });

  if (!response.ok) {
    throw new Error('PayPal payment failed');
  }

  return await response.json();
}

/**
 * تحويل بنكي
 */
export async function initiateBankTransfer(
  paymentIntentId: string,
  currency: string
): Promise<{ 
  bankName: string; 
  accountNumber: string; 
  swiftCode: string; 
  reference: string 
}> {
  const response = await fetch('/api/payments/bank-transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId, currency })
  });

  if (!response.ok) {
    throw new Error('Bank transfer setup failed');
  }

  return await response.json();
}

/**
 * إنشاء اشتراك جديد
 */
export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  currency: string,
  method: PaymentMethod,
  autoRenew: boolean = true
): Promise<Subscription> {
  const response = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, plan, currency, method, autoRenew })
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  return await response.json();
}

/**
 * إلغاء الاشتراك
 */
export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }

  return await response.json();
}

/**
 * الحصول على فاتورة
 */
export async function getInvoice(invoiceId: string): Promise<Invoice> {
  const response = await fetch(`/api/invoices/${invoiceId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch invoice');
  }

  return await response.json();
}

/**
 * الحصول على السعر بعملة محددة
 */
export function getPriceInCurrency(plan: SubscriptionPlan, currency: keyof typeof planPrices): number {
  return planPrices[currency][plan];
}

/**
 * التحقق من حالة الدفع
 */
export async function checkPaymentStatus(paymentIntentId: string): Promise<{
  status: 'pending' | 'succeeded' | 'failed';
  timestamp: Date;
}> {
  const response = await fetch(`/api/payments/status/${paymentIntentId}`);

  if (!response.ok) {
    throw new Error('Failed to check payment status');
  }

  return await response.json();
}

/**
 * استرجاع الاشتراك
 */
export async function retrySubscriptionPayment(subscriptionId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/subscriptions/${subscriptionId}/retry-payment`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Failed to retry payment');
  }

  return await response.json();
}
