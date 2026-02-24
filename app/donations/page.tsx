"use client";

import Navigation from "@/app/components/Navigation";
import { useEffect, useState } from "react";
import { getCurrencyByCountry, convertPrice, formatPrice, currencyInfo } from "@/app/lib/services/currencyService";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { subscribeToAuth } from "@/app/lib/services/authService";
import { DEFAULT_PLATFORM_SETTINGS, saveOrder, subscribeToPlatformSettings } from "@/app/lib/services/firestoreService";

interface DonationCause {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  goalAmount: number;
  collectedAmount: number;
  icon: string;
  category: string;
}

export default function DonationsPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [countryCode, setCountryCode] = useState("SA");
  const [currency, setCurrency] = useState<keyof typeof currencyInfo>("SAR");
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedCause, setSelectedCause] = useState<DonationCause | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [receivePayments, setReceivePayments] = useState(DEFAULT_PLATFORM_SETTINGS.payments.receivePayments);

  const isRTL = userLanguage === "ar";

  useEffect(() => {
    const init = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);

      try {
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        const code = data.country_code || 'SA';
        setCountryCode(code);
        setCurrency(getCurrencyByCountry(code));
      } catch (error) {
        console.error('Error getting country code:', error);
      }
    };

    init();

    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUserId(user?.uid || "");
      if (user?.email) {
        setDonorEmail(user.email);
      }
      if (user?.displayName) {
        setDonorName(user.displayName);
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

  const causes: DonationCause[] = [
    {
      id: 1,
      titleAr: "🤲 تعليم القرآن للأطفال",
      titleEn: "Teaching Quran to Children",
      descriptionAr: "دعم برامج تعليم القرآن الكريم للأطفال المحتاجين في المناطق النائية",
      descriptionEn: "Support Quran education programs for underprivileged children",
      goalAmount: 50000,
      collectedAmount: 32500,
      icon: "📖",
      category: "education"
    },
    {
      id: 2,
      titleAr: "🏥 الدعم الطبي للمحتاجين",
      titleEn: "Medical Aid for the Needy",
      descriptionAr: "توفير العلاج والأدوية للمرضى غير القادرين على تحمل تكاليفهم",
      descriptionEn: "Provide treatment and medicine for those who cannot afford it",
      goalAmount: 100000,
      collectedAmount: 68900,
      icon: "🏥",
      category: "medical"
    },
    {
      id: 3,
      titleAr: "🍽️ كفالة اليتيم والأرملة",
      titleEn: "Orphan and Widow Support",
      descriptionAr: "توفير الطعام واحتياجات الحياة الأساسية للأيتام والأرامل",
      descriptionEn: "Provide food and basic needs for orphans and widows",
      goalAmount: 75000,
      collectedAmount: 45200,
      icon: "🍽️",
      category: "welfare"
    },
    {
      id: 4,
      titleAr: "📚 بناء مكتبة إسلامية",
      titleEn: "Building Islamic Library",
      descriptionAr: "إنشاء مكتبات إسلامية متخصصة في المدارس والمراكز الإسلامية",
      descriptionEn: "Establish Islamic libraries in schools and centers",
      goalAmount: 60000,
      collectedAmount: 38750,
      icon: "📚",
      category: "knowledge"
    }
  ];

  const handleDonation = async () => {
    if (!receivePayments) {
      alert(userLanguage === "ar" ? "استقبال المدفوعات متوقف حالياً بواسطة الإدارة" : "Payments are currently disabled by admin");
      return;
    }

    if (!selectedCause || !donationAmount || !donorEmail) {
      alert(userLanguage === "ar" 
        ? "الرجاء ملء جميع الحقول" 
        : "Please fill all fields");
      return;
    }

    try {
      const donationValue = parseFloat(donationAmount);
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: donationValue,
          currency: currency,
          description: `Donation: ${selectedCause.titleAr}`,
          email: donorEmail,
          userId: currentUserId,
          planId: `donation-${selectedCause.id}`
        })
      });

      const data = await response.json();
      if (data.clientSecret) {
        await saveOrder({
          userId: currentUserId,
          email: donorEmail,
          type: "donation",
          planId: `donation-${selectedCause.id}`,
          planName: userLanguage === "ar" ? selectedCause.titleAr : selectedCause.titleEn,
          amount: donationValue,
          currency,
          paymentIntentId: data.paymentIntentId,
          status: "pending",
        });

        setSuccessMessage(userLanguage === "ar"
          ? "شكراً لتبرعك! يتم معالجة طلبك..."
          : "Thank you for your donation! Processing...");
        
        setTimeout(() => {
          setSelectedCause(null);
          setDonationAmount("");
          setDonorName("");
          setDonorEmail("");
          setSuccessMessage("");
        }, 2000);
      }
    } catch (error) {
      console.error('Donation error:', error);
    }
  };

  const getProgress = (collected: number, goal: number) => {
    return Math.round((collected / goal) * 100);
  };

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
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            textAlign: "center",
            marginBottom: "50px",
          }}>
            <h1 style={{
              fontSize: "42px",
              color: "#1a3a52",
              marginBottom: "15px",
            }}>
              🤲 {userLanguage === "ar" ? "التبرعات والزكاة" : "Donations & Charity"}
            </h1>
            <p style={{
              fontSize: "18px",
              color: "#666",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
              {userLanguage === "ar"
                ? "ساهم في دعم المشاريع الإسلامية والخيرية"
                : "Support Islamic charitable projects"}
            </p>

            {!receivePayments ? (
              <div style={{ backgroundColor: "#fff3e0", color: "#8a4b00", padding: "12px", borderRadius: "8px", marginTop: "12px" }}>
                {userLanguage === "ar" ? "التبرعات متوقفة مؤقتاً بواسطة الإدارة" : "Donations are temporarily disabled by admin"}
              </div>
            ) : null}
          </div>

          {/* Causes Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "25px",
            marginBottom: "50px",
          }}>
            {causes.map((cause) => (
              <div
                key={cause.id}
                onClick={() => setSelectedCause(cause)}
                style={{
                  backgroundColor: selectedCause?.id === cause.id ? "#e8f5e9" : "white",
                  borderRadius: "12px",
                  padding: "25px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  border: selectedCause?.id === cause.id ? "2px solid #4caf50" : "2px solid transparent",
                  transition: "0.3s",
                }}
                onMouseEnter={(e) => {
                  if (selectedCause?.id !== cause.id) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCause?.id !== cause.id) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                  }
                }}
              >
                <div style={{
                  fontSize: "48px",
                  marginBottom: "10px",
                }}>
                  {cause.icon}
                </div>
                <h3 style={{
                  fontSize: "20px",
                  color: "#1a3a52",
                  marginBottom: "10px",
                }}>
                  {userLanguage === "ar" ? cause.titleAr : cause.titleEn}
                </h3>
                <p style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}>
                  {userLanguage === "ar" ? cause.descriptionAr : cause.descriptionEn}
                </p>

                {/* Progress Bar */}
                <div style={{
                  marginBottom: "15px",
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                    fontSize: "12px",
                    color: "#666",
                  }}>
                    <span>{getProgress(cause.collectedAmount, cause.goalAmount)}%</span>
                    <span>
                      {formatPrice(cause.collectedAmount, currency)} / {formatPrice(cause.goalAmount, currency)}
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#eee",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${getProgress(cause.collectedAmount, cause.goalAmount)}%`,
                      height: "100%",
                      backgroundColor: "#4caf50",
                      transition: "width 0.3s",
                    }} />
                  </div>
                </div>

                <button style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: selectedCause?.id === cause.id ? "#4caf50" : "#ffd700",
                  color: selectedCause?.id === cause.id ? "white" : "#1a3a52",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "0.3s",
                }}>
                  {userLanguage === "ar" ? "اختر هذا المشروع" : "Select Project"}
                </button>
              </div>
            ))}
          </div>

          {/* Donation Form */}
          {selectedCause && (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
              <h2 style={{
                fontSize: "28px",
                color: "#1a3a52",
                marginBottom: "30px",
                textAlign: "center",
              }}>
                {userLanguage === "ar" ? "تفاصيل التبرع" : "Donation Details"}
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#1a3a52",
                  marginBottom: "8px",
                }}>
                  {userLanguage === "ar" ? "المبلغ" : "Amount"}
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="0"
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as keyof typeof currencyInfo)}
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#1a3a52",
                  marginBottom: "8px",
                }}>
                  {userLanguage === "ar" ? "اسمك" : "Your Name"}
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={userLanguage === "ar" ? "أدخل اسمك" : "Enter your name"}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "30px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#1a3a52",
                  marginBottom: "8px",
                }}>
                  {userLanguage === "ar" ? "بريدك الإلكتروني" : "Your Email"}
                </label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="example@email.com"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {successMessage && (
                <div style={{
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  padding: "15px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}>
                  ✅ {successMessage}
                </div>
              )}

              <button
                onClick={handleDonation}
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: "#ffd700",
                  color: "#1a3a52",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
              >
                {userLanguage === "ar" ? "تبرع الآن" : "Donate Now"}
              </button>

              <p style={{
                fontSize: "12px",
                color: "#666",
                textAlign: "center",
                marginTop: "15px",
              }}>
                🔒 {userLanguage === "ar" 
                  ? "تبرعك محمي وآمن 100% مع Stripe" 
                  : "100% secure donation with Stripe"}
              </p>
            </div>
          )}
        </section>
      </main>
      </>
    </ProtectedRoute>
  );
}
