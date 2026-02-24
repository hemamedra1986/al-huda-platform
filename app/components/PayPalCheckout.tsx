"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (error: unknown) => void;
      }) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}

interface PayPalCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  userEmail: string;
  userId: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function PayPalCheckout({
  planId,
  planName,
  amount,
  currency,
  userEmail,
  userId,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const containerId = useMemo(() => `paypal-buttons-${Math.random().toString(36).slice(2, 10)}`, []);
  const renderedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      const message = "PayPal client id is missing";
      setError(message);
      setLoading(false);
      onError?.(message);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');

    const renderButtons = async () => {
      if (!window.paypal || renderedRef.current) {
        return;
      }

      renderedRef.current = true;

      try {
        await window.paypal.Buttons({
          createOrder: async () => {
            const response = await fetch("/api/payments/paypal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create-order",
                amount,
                currency,
                description: `${planName} Subscription`,
                userId,
                planId,
                email: userEmail,
              }),
            });

            const data = await response.json();
            if (!response.ok || !data.orderId) {
              throw new Error(data.error || "Failed to create PayPal order");
            }

            return data.orderId;
          },
          onApprove: async (data) => {
            const response = await fetch("/api/payments/paypal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "capture-order",
                orderId: data.orderID,
              }),
            });

            const captureResult = await response.json();
            if (!response.ok) {
              throw new Error(captureResult.error || "Failed to capture PayPal order");
            }

            onSuccess?.(data.orderID);
          },
          onError: (paypalError) => {
            const message = paypalError instanceof Error ? paypalError.message : "PayPal payment failed";
            setError(message);
            onError?.(message);
          },
        }).render(`#${containerId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to render PayPal buttons";
        setError(message);
        onError?.(message);
      } finally {
        setLoading(false);
      }
    };

    if (existingScript) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => {
      renderButtons();
    };
    script.onerror = () => {
      const message = "Failed to load PayPal SDK";
      setError(message);
      setLoading(false);
      onError?.(message);
    };

    document.body.appendChild(script);
  }, [amount, currency, planId, planName, userEmail, userId, onError, onSuccess, containerId]);

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ color: "#1a3a52", marginBottom: "12px" }}>🅿️ PayPal - {planName}</h3>
      <p style={{ marginTop: 0, color: "#666", fontSize: "14px" }}>
        {amount} {currency}
      </p>

      {loading ? <p style={{ color: "#666" }}>⏳ جاري تحميل PayPal...</p> : null}
      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}

      <div id={containerId} />
    </div>
  );
}
