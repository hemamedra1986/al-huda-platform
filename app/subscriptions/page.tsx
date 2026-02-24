"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getCurrencyByCountry, convertPrice, formatPrice, currencyInfo } from "@/app/lib/services/currencyService";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { subscribeToAuth } from "@/app/lib/services/authService";
import { DEFAULT_PLATFORM_SETTINGS, saveOrder, subscribeToPlatformSettings } from "@/app/lib/services/firestoreService";

// استيراد الدفع ديناميكيًا لتقليل حجم الـ bundle
const StripeCheckout = dynamic(() => import("@/app/components/StripeCheckout"), {
  loading: () => <div>⏳ جاري تحميل معالج الدفع...</div>,
  ssr: false
});

const PayPalCheckout = dynamic(() => import("@/app/components/PayPalCheckout"), {
  loading: () => <div>⏳ جاري تحميل PayPal...</div>,
  ssr: false,
});

interface Plan {
  id: string;
  nameAr: string;
  nameEn: string;
  priceInSAR: number;
  color: string;
  featuresAr: string[];
  featuresEn: string[];
  popular: boolean;
}

export default function SubscriptionsPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [countryCode, setCountryCode] = useState("SA");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("user_" + Math.random().toString(36).substr(2, 9));
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [receivePayments, setReceivePayments] = useState(DEFAULT_PLATFORM_SETTINGS.payments.receivePayments);

  useEffect(() => {
    const initLocation = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);

      try {
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        setCountryCode(data.country_code || 'SA');
      } catch (error) {
        console.error('Error getting country code:', error);
      }
      
      setIsLoading(false);
    };
    initLocation();

    const unsubscribe = subscribeToAuth((user) => {
      const uid = user?.uid || "";
      setCurrentUserId(uid);
      if (user?.email) {
        setUserEmail(user.email);
      }
      if (uid) {
        setUserId(uid);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeSettings = subscribeToPlatformSettings((settings) => {
      setReceivePayments(settings.payments.receivePayments);
    });

    return () => unsubscribeSettings();
  }, []);

  const plans: Plan[] = [
    {
      id: "basic",
      nameAr: "الأساسي",
      nameEn: "Basic",
      priceInSAR: 49,
      color: "#fff3e0",
      featuresAr: [
        "✅ 4 كورسات شرعية",
        "✅ 4 استشارات/شهر",
        "✅ وصول غرف صوتية",
        "❌ ترجمة فورية",
        "❌ دعم أولوي",
      ],
      featuresEn: [
        "✅ 4 Islamic courses",
        "✅ 4 consultations/month",
        "✅ Voice room access",
        "❌ Instant translation",
        "❌ Priority support",
      ],
      popular: false,
    },
    {
      id: "professional",
      nameAr: "الاحترافي",
      nameEn: "Professional",
      priceInSAR: 99,
      color: "#e8f5e9",
      featuresAr: [
        "✅ جميع الكورسات",
        "✅ استشارات غير محدودة",
        "✅ غرف صوتية VIP",
        "✅ ترجمة فورية",
        "✅ دعم أولوي",
      ],
      featuresEn: [
        "✅ All courses",
        "✅ Unlimited consultations",
        "✅ VIP voice rooms",
        "✅ Instant translation",
        "✅ Priority support",
      ],
      popular: true,
    },
    {
      id: "advanced",
      nameAr: "المتقدم",
      nameEn: "Advanced",
      priceInSAR: 149,
      color: "#f3e5f5",
      featuresAr: [
        "✅ جميع ميزات الاحترافي",
        "✅ جلسات فردية خاصة",
        "✅ محتوى حصري",
        "✅ شهادات معتمدة",
        "✅ دعم 24/7",
      ],
      featuresEn: [
        "✅ All Professional features",
        "✅ Private individual sessions",
        "✅ Exclusive content",
        "✅ Certified certificates",
        "✅ 24/7 support",
      ],
      popular: false,
    },
  ];

  const isRTL = userLanguage === "ar";
  const currency = getCurrencyByCountry(countryCode);
  const currencyName = currencyInfo[currency].name;

  const handleSelectPlan = (plan: Plan) => {
    if (!receivePayments) {
      alert(userLanguage === "ar" ? "استقبال المدفوعات متوقف حالياً" : "Payments are currently disabled");
      return;
    }

    setSelectedPlan(plan);
    setPaymentMethod("stripe");
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('✅ Payment successful:', paymentIntentId);

    if (selectedPlan && currentUserId) {
      await saveOrder({
        userId: currentUserId,
        email: userEmail,
        type: "subscription",
        planId: selectedPlan.id,
        planName: isRTL ? selectedPlan.nameAr : selectedPlan.nameEn,
        amount: convertPrice(selectedPlan.priceInSAR, currency),
        currency,
        paymentIntentId,
        status: "paid",
      });
    }

    alert(isRTL ? '✅ تم الدفع بنجاح! شكراً لاشتراكك' : '✅ Payment successful! Thank you for subscribing');
    
    // TODO: تحديث حالة المستخدم في قاعدة البيانات
    setShowPaymentForm(false);
    setSelectedPlan(null);
    setUserEmail("");
  };

  const handlePayPalSuccess = async (orderId: string) => {
    if (selectedPlan && currentUserId) {
      await saveOrder({
        userId: currentUserId,
        email: userEmail,
        type: "subscription",
        planId: selectedPlan.id,
        planName: isRTL ? selectedPlan.nameAr : selectedPlan.nameEn,
        amount: convertPrice(selectedPlan.priceInSAR, currency),
        currency,
        paymentIntentId: orderId,
        status: "paid",
      });
    }

    alert(isRTL ? "✅ تم الدفع عبر PayPal بنجاح" : "✅ PayPal payment successful");
    setShowPaymentForm(false);
    setSelectedPlan(null);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>⏳ جاري التحميل...</div>;
  }

  return (
    <ProtectedRoute allowGuest>
      <>
      <Navigation />
      <main style={{
        direction: isRTL ? "rtl" : "ltr",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "40px 20px",
      }}>
        <section style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
          <h1 style={{
            fontSize: "36px",
            color: "#1a3a52",
            marginBottom: "10px",
            textAlign: "center",
          }}>
            💎 {isRTL ? 'خطط الاشتراك' : 'Subscription Plans'}
          </h1>

          {!receivePayments ? (
            <div style={{ backgroundColor: "#fff3e0", color: "#8a4b00", padding: "12px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
              {isRTL ? "الاشتراكات متوقفة مؤقتاً بواسطة الإدارة" : "Subscriptions are temporarily disabled by admin"}
            </div>
          ) : null}
          
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "50px",
            gap: "15px",
            flexWrap: "wrap",
          }}>
            <p style={{
              fontSize: "18px",
              color: "#666",
              textAlign: "center",
              margin: 0,
            }}>
              {isRTL 
                ? 'اختر الخطة المناسبة لك واستمتع بجميع الميزات'
                : 'Choose the right plan for you and enjoy all features'}
            </p>
            
            <div style={{
              backgroundColor: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}>
              <span style={{ fontWeight: "bold", color: "#1a3a52" }}>
                💱 {currency} ({currencyName})
              </span>
            </div>
          </div>

          {/* عرض نموذج الدفع إذا تم اختيار خطة */}
          {showPaymentForm && selectedPlan && (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              marginBottom: "40px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
              maxWidth: "600px",
              margin: "0 auto 40px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "25px",
              }}>
                <h2 style={{
                  margin: 0,
                  color: "#1a3a52",
                  fontSize: "24px",
                }}>
                  {isRTL ? 'اختمام الدفع' : 'Complete Payment'}
                </h2>
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedPlan(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                marginBottom: "25px",
              }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  color: "#1a3a52",
                }}>
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder={isRTL ? "your@email.com" : "your@email.com"}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#1a3a52" }}>
                  {isRTL ? "طريقة الدفع" : "Payment Method"}
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setPaymentMethod("stripe")}
                    style={{
                      border: paymentMethod === "stripe" ? "2px solid #1a3a52" : "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      backgroundColor: paymentMethod === "stripe" ? "#eef4ff" : "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    💳 Stripe
                  </button>
                  <button
                    onClick={() => setPaymentMethod("paypal")}
                    style={{
                      border: paymentMethod === "paypal" ? "2px solid #1a3a52" : "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      backgroundColor: paymentMethod === "paypal" ? "#eef4ff" : "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    🅿️ PayPal
                  </button>
                </div>
              </div>

              {userEmail && paymentMethod === "stripe" && (
                <StripeCheckout
                  planId={selectedPlan.id}
                  planName={isRTL ? selectedPlan.nameAr : selectedPlan.nameEn}
                  amount={convertPrice(selectedPlan.priceInSAR, currency)}
                  currency={currency}
                  userEmail={userEmail}
                  userId={userId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {userEmail && paymentMethod === "paypal" && (
                <PayPalCheckout
                  planId={selectedPlan.id}
                  planName={isRTL ? selectedPlan.nameAr : selectedPlan.nameEn}
                  amount={convertPrice(selectedPlan.priceInSAR, currency)}
                  currency={currency}
                  userEmail={userEmail}
                  userId={userId}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePaymentError}
                />
              )}
            </div>
          )}

          {/* قائمة الخطط */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "25px",
            marginBottom: "50px",
          }}>
            {plans.map((plan) => {
              const price = convertPrice(plan.priceInSAR, currency);
              const formattedPrice = formatPrice(price, currency, isRTL);
              const isSelected = selectedPlan?.id === plan.id;
              const features = isRTL ? plan.featuresAr : plan.featuresEn;

              return (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: plan.color,
                    borderRadius: "12px",
                    padding: "30px",
                    boxShadow: plan.popular ? "0 12px 24px rgba(0,0,0,0.15)" : "0 4px 8px rgba(0,0,0,0.1)",
                    border: isSelected ? "3px solid #ffd700" : "3px solid transparent",
                    transition: "all 0.3s",
                    transform: plan.popular ? "scale(1.05)" : "scale(1)",
                    position: "relative",
                  }}
                >
                  {/* الشارة الشهيرة */}
                  {plan.popular && (
                    <div style={{
                      position: "absolute",
                      top: "-15px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#ffd700",
                      color: "#1a3a52",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}>
                      ⭐ {isRTL ? 'الأكثر شهرة' : 'Most Popular'}
                    </div>
                  )}

                  <h3 style={{
                    fontSize: "24px",
                    color: "#1a3a52",
                    marginBottom: "15px",
                    marginTop: plan.popular ? "15px" : 0,
                  }}>
                    {isRTL ? plan.nameAr : plan.nameEn}
                  </h3>

                  <div style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#ffd700",
                    marginBottom: "20px",
                  }}>
                    {formattedPrice}
                    <span style={{
                      fontSize: "14px",
                      color: "#666",
                      marginLeft: "8px",
                    }}>
                      {isRTL ? '/ شهر' : '/ month'}
                    </span>
                  </div>

                  <div style={{
                    borderTop: "2px solid rgba(0,0,0,0.1)",
                    borderBottom: "2px solid rgba(0,0,0,0.1)",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    marginBottom: "20px",
                  }}>
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: "14px",
                          color: "#333",
                          marginBottom: "10px",
                          lineHeight: "1.6",
                        }}
                      >
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      backgroundColor: isSelected ? "#ff6b6b" : "#1a3a52",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2a5a82";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a3a52";
                      }
                    }}
                  >
                    {isSelected
                      ? (isRTL ? '🔄 تغيير' : '🔄 Change')
                      : (isRTL ? '✨ اختر الآن' : '✨ Choose Now')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* الأسئلة الشائعة */}
          <section style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}>
            <h2 style={{
              fontSize: "28px",
              color: "#1a3a52",
              marginBottom: "30px",
              textAlign: "center",
            }}>
              ❓ {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
            }}>
              {[
                {
                  qAr: 'هل يمكنني تغيير الخطة لاحقًا؟',
                  qEn: 'Can I change plans later?',
                  aAr: 'نعم، يمكنك تغيير خطتك أو الترقية في أي وقت.',
                  aEn: 'Yes, you can change or upgrade your plan at any time.'
                },
                {
                  qAr: 'هل هناك ضمان استرجاع المال؟',
                  qEn: 'Is there a money-back guarantee?',
                  aAr: 'نعم، ضمان استرجاع المال خلال 30 يومًا بدون أسئلة.',
                  aEn: 'Yes, 30-day money-back guarantee with no questions.'
                },
                {
                  qAr: 'هل الاشتراك يتجدد تلقائيًا؟',
                  qEn: 'Does subscription auto-renew?',
                  aAr: 'نعم، ولكن يمكنك الإلغاء في أي وقت.',
                  aEn: 'Yes, but you can cancel anytime.'
                },
              ].map((item, index) => (
                <div key={index} style={{
                  padding: "20px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                }}>
                  <h4 style={{
                    color: "#1a3a52",
                    marginBottom: "10px",
                    fontSize: "16px",
                  }}>
                    {isRTL ? item.qAr : item.qEn}
                  </h4>
                  <p style={{
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.6",
                  }}>
                    {isRTL ? item.aAr : item.aEn}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
      </>
    </ProtectedRoute>
  );
}
