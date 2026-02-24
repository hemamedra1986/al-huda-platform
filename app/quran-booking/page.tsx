"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { SURAHS, RECITERS, Reciter } from "@/app/lib/services/quranService";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import { getCurrencyByCountry, convertPrice, formatPrice, currencyInfo } from "@/app/lib/services/currencyService";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { subscribeToAuth } from "@/app/lib/services/authService";
import { saveBooking, saveOrder } from "@/app/lib/services/firestoreService";

interface QuranLesson {
  id: number;
  sheikhNameAr: string;
  sheikhNameEn: string;
  specialty: string;
  priceInSAR: number;
  isFree?: boolean;
  rating: number;
  image: string;
  bio: string;
  experience: string;
  availableSlots: string[];
}

export default function QuranBookingPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [countryCode, setCountryCode] = useState("SA");
  const [currency, setCurrency] = useState<keyof typeof currencyInfo>("SAR");
  const [selectedSheikh, setSelectedSheikh] = useState<QuranLesson | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [learningLevel, setLearningLevel] = useState("beginner");
  const [notes, setNotes] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const isRTL = userLanguage === "ar";

  useEffect(() => {
    const initLocation = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);

      try {
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        setCountryCode(data.country_code || 'SA');
        const cur = getCurrencyByCountry(data.country_code || 'SA');
        setCurrency(cur);
      } catch (error) {
        console.error('Error getting country code:', error);
      }
    };
    initLocation();

    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUserId(user?.uid || "");
      if (user?.email) {
        setStudentEmail(user.email);
      }
      if (user?.displayName) {
        setStudentName(user.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  const sheikhs: QuranLesson[] = [
    {
      id: 0,
      sheikhNameAr: "درس تجريبي مجاني",
      sheikhNameEn: "Free Trial Lesson",
      specialty: "تجريبي مجاني 30 دقيقة",
      priceInSAR: 0,
      isFree: true,
      rating: 5.0,
      image: "🎁",
      bio: "درس تجريبي مجاني للطلاب الجدد - 30 دقيقة",
      experience: "لجميع المستويات",
      availableSlots: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
    },
    {
      id: 1,
      sheikhNameAr: "الشيخ عبد الرزاق العباد",
      sheikhNameEn: "Sheikh Abdulrazaq Al-Abbad",
      specialty: "تجويد وحفظ",
      priceInSAR: 150,
      rating: 4.9,
      image: "👨‍🏫",
      bio: "متخصص في تعليم التجويد والحفظ بطرق حديثة",
      experience: "20 سنة في التدريس القرآني",
      availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
    },
    {
      id: 2,
      sheikhNameAr: "الشيخ محمد الحمد",
      sheikhNameEn: "Sheikh Muhammad Al-Hamad",
      specialty: "ترتيل وتفسير",
      priceInSAR: 200,
      rating: 4.8,
      image: "👨‍🏫",
      bio: "خبير في الترتيل والتفسير المبسط",
      experience: "15 سنة في التعليم",
      availableSlots: ["08:00", "10:00", "13:00", "15:00", "17:00", "18:00"],
    },
    {
      id: 3,
      sheikhNameAr: "الشيخة فاطمة الزهراء",
      sheikhNameEn: "Sheikha Fatima Al-Zahra",
      specialty: "تحفيظ للأطفال",
      priceInSAR: 100,
      rating: 5.0,
      image: "👩‍🏫",
      bio: "متخصصة في تعليم الأطفال بطرق تفاعلية",
      experience: "12 سنة مع الأطفال",
      availableSlots: ["10:00", "11:00", "12:00", "15:00", "16:00"],
    },
    {
      id: 4,
      sheikhNameAr: "الشيخ أحمد الشرقاوي",
      sheikhNameEn: "Sheikh Ahmad Al-Sharqawi",
      specialty: "أحكام التجويد",
      priceInSAR: 250,
      rating: 4.7,
      image: "👨‍🏫",
      bio: "تخصص دقيق في أحكام التجويد العملية",
      experience: "18 سنة خبرة",
      availableSlots: ["09:00", "11:00", "14:00", "16:00", "18:00"],
    },
  ];

  const convertedPrice = selectedSheikh ? convertPrice(selectedSheikh.priceInSAR, currency) : 0;
  const formattedPrice = formatPrice(convertedPrice, currency);

  const handleBooking = async () => {
    if (!selectedSheikh || !selectedDate || !selectedTime || !selectedSurah || !studentName || !studentEmail) {
      alert(userLanguage === "ar" 
        ? "يرجى ملء جميع الحقول المطلوبة"
        : "Please fill all required fields");
      return;
    }

    try {
      const amount = Math.round(convertedPrice * 100);
      const effectiveUserId = currentUserId || `guest_${Date.now()}`;

      await saveBooking({
        userId: effectiveUserId,
        studentName,
        studentEmail,
        sheikhName: selectedSheikh.sheikhNameAr,
        surahNumber: selectedSurah,
        date: selectedDate,
        time: selectedTime,
        learningLevel,
        notes,
        amount: convertedPrice,
        currency,
        paymentStatus: selectedSheikh.isFree ? "free" : "pending",
      });

      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currency,
          description: `درس قرآن مع ${selectedSheikh.sheikhNameAr}`,
          userId: effectiveUserId,
          email: studentEmail,
        })
      });

      const data = await response.json();
      if (data.clientSecret) {
        await saveOrder({
          userId: effectiveUserId,
          email: studentEmail,
          type: "booking",
          planId: `quran-booking-${selectedSheikh.id}`,
          planName: `Quran lesson with ${selectedSheikh.sheikhNameAr}`,
          amount: convertedPrice,
          currency,
          paymentIntentId: data.paymentIntentId,
          status: selectedSheikh.isFree ? "paid" : "pending",
        });

        // في الإنتاج: توجيه لصفحة الدفع
        alert(userLanguage === "ar"
          ? `تم إنشاء عملية الدفع برقم: ${data.paymentIntentId}`
          : `Payment created with ID: ${data.paymentIntentId}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert(userLanguage === "ar" ? "حدث خطأ أثناء الحجز" : "Booking error occurred");
    }
  };

  return (
    <ProtectedRoute allowGuest>
      <>
      <Navigation />
      <main style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "20px",
        direction: isRTL ? "rtl" : "ltr",
      }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #27ae60 0%, #229954 100%)",
            color: "white",
            padding: "30px 20px",
            borderRadius: "12px",
            textAlign: "center",
            marginBottom: "30px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}>
            <h1 style={{
              fontSize: "32px",
              margin: "0 0 10px 0",
              fontWeight: "bold",
            }}>
              📅 {userLanguage === "ar" ? "احجز درسك القرآني" : "Book Your Quran Lesson"}
            </h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {userLanguage === "ar"
                ? "تعلم القرآن مباشرة مع شيوخ متخصصين"
                : "Learn Quran directly with specialized teachers"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "30px",
            gap: "10px",
          }}>
            {[1, 2, 3, 4].map(step => (
              <div key={step} style={{
                flex: 1,
                height: "8px",
                backgroundColor: step <= bookingStep ? "#27ae60" : "#ddd",
                borderRadius: "4px",
                transition: "all 0.3s",
              }}></div>
            ))}
          </div>

          {/* Step 1: Select Sheikh */}
          {bookingStep === 1 && (
            <div style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px",
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1a3a52",
                marginTop: 0,
              }}>
                1️⃣ {userLanguage === "ar" ? "اختر الشيخ" : "Select a Sheikh"}
              </h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "15px",
              }}>
                {sheikhs.map(sheikh => (
                  <div
                    key={sheikh.id}
                    onClick={() => setSelectedSheikh(sheikh)}
                    style={{
                      padding: "20px",
                      border: selectedSheikh?.id === sheikh.id ? "2px solid #27ae60" : "1px solid #ddd",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: selectedSheikh?.id === sheikh.id ? "#f0fdf4" : "#fff",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ fontSize: "32px", marginBottom: "10px" }}>{sheikh.image}</div>
                    <div style={{ fontWeight: "bold", color: "#1a3a52", marginBottom: "5px", fontSize: "16px" }}>
                      {sheikh.sheikhNameAr}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                      {sheikh.specialty}
                    </div>
                    <div style={{ fontSize: "13px", color: "#f39c12", marginBottom: "10px" }}>
                      ⭐ {sheikh.rating} • {sheikh.experience}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px", minHeight: "40px" }}>
                      {sheikh.bio}
                    </div>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: sheikh.isFree ? "#27ae60" : "#27ae60",
                      paddingTop: "10px",
                      borderTop: "1px solid #eee",
                    }}>
                      {sheikh.isFree 
                        ? (userLanguage === "ar" ? "🎁 مجاني" : "🎁 FREE")
                        : `${userLanguage === "ar" ? "السعر: " : "Price: "}${formatPrice(convertPrice(sheikh.priceInSAR, currency), currency)}/${userLanguage === "ar" ? "الساعة" : "hour"}`
                      }
                    </div>
                  </div>
                ))}
              </div>

              {selectedSheikh && (
                <button
                  onClick={() => setBookingStep(2)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "20px",
                    backgroundColor: "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "التالي" : "Next"}
                </button>
              )}
            </div>
          )}

          {/* Step 2: Select Surah & Date */}
          {bookingStep === 2 && (
            <div style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px",
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1a3a52",
                marginTop: 0,
              }}>
                2️⃣ {userLanguage === "ar" ? "اختر السورة والموعد" : "Select Surah & Date"}
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
                  {userLanguage === "ar" ? "السورة" : "Surah"}
                </label>
                <select
                  value={selectedSurah || ""}
                  onChange={(e) => setSelectedSurah(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">
                    {userLanguage === "ar" ? "اختر سورة" : "Select a Surah"}
                  </option>
                  {SURAHS.map(surah => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.nameAr} ({surah.versesCount} {userLanguage === "ar" ? "آية" : "verses"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
                  {userLanguage === "ar" ? "التاريخ" : "Date"}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
                  {userLanguage === "ar" ? "الوقت" : "Time"}
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">{userLanguage === "ar" ? "اختر الوقت" : "Select time"}</option>
                  {selectedSheikh?.availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setBookingStep(1)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#ddd",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "رجوع" : "Back"}
                </button>
                <button
                  onClick={() => setBookingStep(3)}
                  disabled={!selectedSurah || !selectedDate || !selectedTime}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: !selectedSurah || !selectedDate || !selectedTime ? "#ccc" : "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: !selectedSurah || !selectedDate || !selectedTime ? "not-allowed" : "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Student Info */}
          {bookingStep === 3 && (
            <div style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px",
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1a3a52",
                marginTop: 0,
              }}>
                3️⃣ {userLanguage === "ar" ? "معلومات الطالب" : "Student Information"}
              </h2>

              <input
                type="text"
                placeholder={userLanguage === "ar" ? "اسمك" : "Your name"}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="email"
                placeholder={userLanguage === "ar" ? "بريدك الإلكتروني" : "Your email"}
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="number"
                placeholder={userLanguage === "ar" ? "عمرك" : "Your age"}
                value={studentAge}
                onChange={(e) => setStudentAge(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              />

              <select
                value={learningLevel}
                onChange={(e) => setLearningLevel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              >
                <option value="beginner">{userLanguage === "ar" ? "مبتدئ" : "Beginner"}</option>
                <option value="intermediate">{userLanguage === "ar" ? "متوسط" : "Intermediate"}</option>
                <option value="advanced">{userLanguage === "ar" ? "متقدم" : "Advanced"}</option>
              </select>

              <textarea
                placeholder={userLanguage === "ar" ? "ملاحظات إضافية" : "Additional notes"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  minHeight: "80px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setBookingStep(2)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#ddd",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "رجوع" : "Back"}
                </button>
                <button
                  onClick={() => setBookingStep(4)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {userLanguage === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation & Payment */}
          {bookingStep === 4 && selectedSheikh && (
            <div style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px",
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1a3a52",
                marginTop: 0,
              }}>
                4️⃣ {userLanguage === "ar" ? "تأكيد و الدفع" : "Confirmation & Payment"}
              </h2>

              <div style={{
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}>
                <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #ddd" }}>
                  <strong>{userLanguage === "ar" ? "الشيخ:" : "Sheikh:"}</strong> {selectedSheikh.sheikhNameAr}
                </div>
                <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #ddd" }}>
                  <strong>{userLanguage === "ar" ? "السعر:" : "Price:"}</strong> {selectedSheikh.isFree ? (userLanguage === "ar" ? "🎁 مجاني" : "🎁 FREE") : formattedPrice}
                </div>
                <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #ddd" }}>
                  <strong>{userLanguage === "ar" ? "الاسم:" : "Name:"}</strong> {studentName}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>{userLanguage === "ar" ? "البريد:" : "Email:"}</strong> {studentEmail}
                </div>
              </div>

              <button
                onClick={handleBooking}
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
              >
                💳 {userLanguage === "ar" ? "ادفع الآن" : "Pay Now"}
              </button>

              <button
                onClick={() => setBookingStep(3)}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#ddd",
                  color: "#333",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {userLanguage === "ar" ? "رجوع" : "Back"}
              </button>
            </div>
          )}
        </div>
      </main>
      </>
    </ProtectedRoute>
  );
}
