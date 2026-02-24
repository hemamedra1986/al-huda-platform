"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe as StripeType } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(stripePublishableKey);

interface StripeCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  userEmail: string;
  userId: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * مكون الدفع - معالج البطاقة والدفع
 */
function StripeCheckoutForm({
  planId,
  planName,
  amount,
  currency,
  userEmail,
  userId,
  onSuccess,
  onError
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // إنشاء Payment Intent عند تحميل المكون
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount,
            currency,
            description: `${planName} Subscription`,
            userId,
            planId,
            email: userEmail
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize payment';
        setErrorMessage(message);
        onError?.(message);
      }
    };

    createPaymentIntent();
  }, [amount, currency, planId, planName, userId, userEmail, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // الحصول على بيانات البطاقة
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // تأكيد الدفع
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: userEmail,
              name: userId
            }
          }
        }
      );

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        onError?.(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSuccessMessage('✅ Payment successful! Your subscription is now active.');
        onSuccess?.(paymentIntent.id);

        // إعادة تعيين النموذج
        cardElement.clear();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurred';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        color: '#1a3a52',
        marginBottom: '20px',
        fontSize: '18px'
      }}>
        📳 {planName} - {amount} {currency}
      </h3>

      <div style={{
        marginBottom: '20px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#666',
          fontSize: '14px'
        }}>
          بيانات البطاقة
        </label>
        <div style={{
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          backgroundColor: '#f9f9f9'
        }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#424242',
                  '::placeholder': {
                    color: '#aaa'
                  }
                },
                invalid: {
                  color: '#fa755a'
                }
              }
            }}
          />
        </div>
      </div>

      <div style={{
        marginBottom: '20px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#666',
          fontSize: '14px'
        }}>
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={userEmail}
          disabled
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            backgroundColor: '#f5f5f5',
            fontSize: '14px'
          }}
        />
      </div>

      {/* رسالة الخطأ */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px'
        }}>
          ❌ {errorMessage}
        </div>
      )}

      {/* رسالة النجاح */}
      {successMessage && (
        <div style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px'
        }}>
          {successMessage}
        </div>
      )}

      {/* زر الدفع */}
      <button
        type="submit"
        disabled={isProcessing || !clientSecret}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isProcessing ? '#ccc' : '#ffd700',
          color: '#1a3a52',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: '0.3s',
          opacity: isProcessing ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isProcessing) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffed4e';
          }
        }}
        onMouseLeave={(e) => {
          if (!isProcessing) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffd700';
          }
        }}
      >
        {isProcessing ? '⏳ جاري المعالجة...' : `💳 ادفع الآن - ${amount} ${currency}`}
      </button>

      <p style={{
        fontSize: '12px',
        color: '#999',
        marginTop: '12px',
        textAlign: 'center'
      }}>
        🔒 الدفع آمن بنسبة 100% مع Stripe
      </p>
    </form>
  );
}

/**
 * مكون مغلف Stripe Elements
 */
export default function StripeCheckout(props: StripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripeCheckoutForm {...props} />
    </Elements>
  );
}

// تصدير أيضًا المكون الداخلي للاستخدام بدون wrapper
export { StripeCheckoutForm };
