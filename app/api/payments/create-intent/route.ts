import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint لإنشاء نية دفع جديدة
 * يتم التكامل مع Stripe, PayPal, البنوك
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, currency, method } = body;

    // التحقق من البيانات
    if (!userId || !plan || !currency || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // أسعار الخطط بالعملات المختلفة
    const prices: { [key: string]: { [key: string]: number } } = {
      SAR: { basic: 49, professional: 99, advanced: 149, enterprise: 299 },
      USD: { basic: 13, professional: 26, advanced: 40, enterprise: 80 },
      EUR: { basic: 12, professional: 24, advanced: 36, enterprise: 72 },
      AED: { basic: 47, professional: 95, advanced: 143, enterprise: 287 },
      EGP: { basic: 195, professional: 390, advanced: 585, enterprise: 1170 },
      GBP: { basic: 11, professional: 21, advanced: 32, enterprise: 64 },
      JPY: { basic: 1400, professional: 2800, advanced: 4200, enterprise: 8400 },
      CNY: { basic: 85, professional: 170, advanced: 255, enterprise: 510 }
    };

    const amount = prices[currency]?.[plan];
    if (!amount) {
      return NextResponse.json(
        { error: 'Invalid plan or currency' },
        { status: 400 }
      );
    }

    // إنشاء نية دفع
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      status: 'pending',
      method,
      userId,
      planId: plan,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // ينتهي بعد 24 ساعة
    };

    // حفظ في قاعدة البيانات (في الإنتاج)
    // await savePaymentIntent(paymentIntent);

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
