"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navigation from "@/app/components/Navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import {
  DEFAULT_PLATFORM_SETTINGS,
  hasUsedFirstFreeConsultation,
  saveMessage,
  saveOrder,
  subscribeToPlatformSettings,
} from "@/app/lib/services/firestoreService";
import { getOrCreateGuestSession } from "@/app/lib/services/guestSessionService";

type ConsultationType = "psychology" | "family" | "islamic";

const StripeCheckout = dynamic(() => import("@/app/components/StripeCheckout"), {
  ssr: false,
  loading: () => <p>⏳ جاري تحميل Stripe...</p>,
});

const PayPalCheckout = dynamic(() => import("@/app/components/PayPalCheckout"), {
  ssr: false,
  loading: () => <p>⏳ جاري تحميل PayPal...</p>,
});

const consultationTypes: {
  value: ConsultationType;
  label: string;
  priceSAR: number;
}[] = [
  { value: "psychology", label: "استشارة نفسية", priceSAR: 120 },
  { value: "family", label: "استشارة أسرية", priceSAR: 140 },
  { value: "islamic", label: "استشارة شرعية", priceSAR: 100 },
];

export default function ConsultationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [consultationType, setConsultationType] = useState<ConsultationType>("islamic");
  const [question, setQuestion] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [readyForPayment, setReadyForPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [receivePayments, setReceivePayments] = useState(DEFAULT_PLATFORM_SETTINGS.payments.receivePayments);
  const [checkingFreeConsultation, setCheckingFreeConsultation] = useState(true);
  const [firstConsultationFree, setFirstConsultationFree] = useState(false);

  useEffect(() => {
    const guest = getOrCreateGuestSession();
    setUserId(guest.userId);
    setUserEmail(guest.email);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const checkFreeConsultation = async () => {
      setCheckingFreeConsultation(true);
      try {
        const used = await hasUsedFirstFreeConsultation(userId);
        setFirstConsultationFree(!used);
      } finally {
        setCheckingFreeConsultation(false);
      }
    };

    checkFreeConsultation();
  }, [userId]);

  useEffect(() => {
    const unsubscribeSettings = subscribeToPlatformSettings((settings) => {
      setReceivePayments(settings.payments.receivePayments);
    });

    return () => unsubscribeSettings();
  }, []);

  const selectedType = useMemo(
    () => consultationTypes.find((type) => type.value === consultationType) || consultationTypes[2],
    [consultationType],
  );

  const planId = `consultation-${consultationType}`;
  const planName = selectedType.label;
  const amount = selectedType.priceSAR;
  const currency = "SAR";

  const startRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!question.trim()) {
      setErrorMessage("يرجى كتابة السؤال قبل الدفع");
      return;
    }

    if (firstConsultationFree) {
      completeFirstFreeConsultation();
      return;
    }

    if (!receivePayments) {
      setErrorMessage("استقبال المدفوعات متوقف حالياً بواسطة الإدارة.");
      return;
    }

    setReadyForPayment(true);
  };

  const completeFirstFreeConsultation = async () => {
    if (!userId || !userEmail) {
      setErrorMessage("تعذر إنشاء هوية الزائر، حدّث الصفحة وحاول مرة أخرى.");
      return;
    }

    try {
      await saveOrder({
        userId,
        email: userEmail,
        type: "booking",
        planId: "consultation-free-first",
        planName: "First free consultation",
        amount: 0,
        currency,
        paymentIntentId: `free-consultation-${Date.now()}`,
        status: "paid",
      });

      await saveMessage({
        userId,
        senderId: userId,
        roomId: `user-${userId}`,
        senderRole: "user",
        text: question.trim(),
        language: "ar",
      });

      setFirstConsultationFree(false);
      setQuestion("");
      setSuccessMessage("✅ تم فتح الاستشارة المجانية الأولى وإرسال سؤالك بنجاح.");
      setTimeout(() => {
        router.push("/messages");
      }, 700);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "فشل إنشاء الاستشارة المجانية الأولى");
    }
  };

  const completeAfterPayment = async (transactionId: string) => {
    if (!userId || !userEmail) {
      throw new Error("User session is missing");
    }

    await saveOrder({
      userId,
      email: userEmail,
      type: "booking",
      planId,
      planName,
      amount,
      currency,
      paymentIntentId: transactionId,
      status: "paid",
    });

    await saveMessage({
      userId,
      senderId: userId,
      roomId: `user-${userId}`,
      senderRole: "user",
      text: question.trim(),
      language: "ar",
    });

    setSuccessMessage("✅ تم الدفع وفتح الشات مع الأدمن.");
    setQuestion("");
    setReadyForPayment(false);

    setTimeout(() => {
      router.push("/messages");
    }, 700);
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    try {
      await completeAfterPayment(paymentIntentId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "فشل إنهاء طلب الاستشارة بعد الدفع");
    }
  };

  const handlePayPalSuccess = async (orderId: string) => {
    try {
      await completeAfterPayment(orderId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "فشل إنهاء طلب الاستشارة بعد الدفع");
    }
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error || "حدث خطأ أثناء عملية الدفع");
  };

  return (
    <ProtectedRoute allowGuest>
      <>
        <Navigation />
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "#f5f5f5",
            padding: "30px 20px",
            direction: "rtl",
          }}
        >
          <section
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h1 style={{ marginTop: 0, color: "#1a3a52", fontSize: "30px" }}>طلب استشارة</h1>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              1) اكتب سؤالك 2) أول استشارة مجانية 3) بعد ذلك الدفع حسب الخطة.
            </p>

            {checkingFreeConsultation ? (
              <div style={{ backgroundColor: "#eef4ff", color: "#1a3a52", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
                ⏳ جاري التحقق من الاستشارة المجانية الأولى...
              </div>
            ) : firstConsultationFree ? (
              <div style={{ backgroundColor: "#e8f5e9", color: "#1b5e20", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
                🎁 لديك استشارة أولى مجانية الآن.
              </div>
            ) : null}

            {!receivePayments ? (
              <div style={{ backgroundColor: "#fff3e0", color: "#8a4b00", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
                المدفوعات متوقفة مؤقتاً بواسطة الإدارة.
              </div>
            ) : null}

            <form onSubmit={startRequest} style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
              <label style={{ fontWeight: "bold", color: "#1a3a52" }}>اختيار نوع الاستشارة</label>
              <select
                value={consultationType}
                onChange={(event) => setConsultationType(event.target.value as ConsultationType)}
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
              >
                {consultationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.priceSAR} SAR
                  </option>
                ))}
              </select>

              <label style={{ fontWeight: "bold", color: "#1a3a52" }}>سؤالك</label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                placeholder="اكتب سؤالك هنا..."
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />

              {!firstConsultationFree ? <label style={{ fontWeight: "bold", color: "#1a3a52" }}>طريقة الدفع</label> : null}
              {!firstConsultationFree ? <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  disabled={!receivePayments}
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
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  disabled={!receivePayments}
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
              </div> : null}

              <button
                type="submit"
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#1a3a52",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {firstConsultationFree ? "إرسال الاستشارة المجانية" : "متابعة الدفع"}
              </button>
            </form>

            {readyForPayment && !firstConsultationFree ? (
              <div style={{ marginTop: "8px" }}>
                <p style={{ color: "#1a3a52", fontWeight: "bold" }}>
                  المبلغ المطلوب: {amount} {currency}
                </p>

                {paymentMethod === "stripe" ? (
                  <StripeCheckout
                    planId={planId}
                    planName={planName}
                    amount={amount}
                    currency={currency}
                    userEmail={userEmail}
                    userId={userId}
                    onSuccess={handleStripeSuccess}
                    onError={handlePaymentError}
                  />
                ) : (
                  <PayPalCheckout
                    planId={planId}
                    planName={planName}
                    amount={amount}
                    currency={currency}
                    userEmail={userEmail}
                    userId={userId}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePaymentError}
                  />
                )}
              </div>
            ) : null}

            {successMessage ? <p style={{ color: "#0a7a33", marginTop: "14px" }}>{successMessage}</p> : null}
            {errorMessage ? <p style={{ color: "#b00020", marginTop: "14px" }}>{errorMessage}</p> : null}
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
