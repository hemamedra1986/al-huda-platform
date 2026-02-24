import { NextRequest, NextResponse } from "next/server";

const PAYPAL_BASE_URL = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal token error: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  planId: string;
}) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: params.description,
          amount: {
            currency_code: params.currency,
            value: Number(params.amount).toFixed(2),
          },
          custom_id: params.userId,
          reference_id: params.planId,
        },
      ],
      application_context: {
        brand_name: "Al-Huda Platform",
        user_action: "PAY_NOW",
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal create order error: ${errorText}`);
  }

  return response.json();
}

async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal capture order error: ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create-order") {
      const { amount, currency, description, userId, planId } = body;

      if (!amount || !currency || !userId || !planId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const order = await createPayPalOrder({
        amount: Number(amount),
        currency,
        description: description || `Subscription: ${planId}`,
        userId,
        planId,
      });

      return NextResponse.json({
        orderId: order.id,
        status: order.status,
      });
    }

    if (action === "capture-order") {
      const { orderId } = body;

      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const capture = await capturePayPalOrder(orderId);
      return NextResponse.json(capture);
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
