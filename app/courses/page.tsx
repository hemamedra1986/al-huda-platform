"use client";

import Navigation from "@/app/components/Navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import { getCurrencyByCountry, convertPrice, formatPrice, currencyInfo } from "@/app/lib/services/currencyService";
import { FREE_OFFERS } from "@/app/lib/services/freeOffersService";

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  priceInSAR: number;
  isFree: boolean;
  level: string;
  icon: string;
  lessons: number;
  duration: string;
}

export default function CoursesPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [countryCode, setCountryCode] = useState("SA");
  const [currency, setCurrency] = useState<keyof typeof currencyInfo>("SAR");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

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
      
      setIsLoading(false);
    };
    initLocation();
  }, []);

  const courses: Course[] = [
    {
      id: 0,
      title: userLanguage === "ar" ? "دورة البداية المجانية" : "Free Beginner Course",
      description: userLanguage === "ar" 
        ? "دورة أساسية في أحكام التجويد والقراءة الصحيحة - مجانية بالكامل"
        : "Fundamental course in Tajweed and correct recitation - Completely free",
      instructor: userLanguage === "ar" ? "الشيخ محمد العتيبي" : "Sheikh Muhammad Al-Otaibi",
      priceInSAR: 0,
      isFree: true,
      level: userLanguage === "ar" ? "مبتدئ" : "Beginner",
      icon: "🎁",
      lessons: 5,
      duration: userLanguage === "ar" ? "4 أسابيع" : "4 weeks",
    },
    {
      id: 1,
      title: userLanguage === "ar" ? "التفسير" : "Quranic Interpretation",
      description: userLanguage === "ar" 
        ? "شرح تفصيلي لآيات القرآن الكريم"
        : "Detailed explanation of Quranic verses",
      instructor: userLanguage === "ar" ? "الشيخ العلامة" : "Sheikh Al-Allama",
      priceInSAR: 200,
      isFree: false,
      level: userLanguage === "ar" ? "مبتدئ" : "Beginner",
      icon: "📖",
      lessons: 12,
      duration: userLanguage === "ar" ? "شهر واحد" : "1 month",
    },
    {
      id: 2,
      title: userLanguage === "ar" ? "الحديث والسيرة" : "Hadith and Biography",
      description: userLanguage === "ar" 
        ? "دراسة السنة النبوية وسيرة الرسول"
        : "Study of Prophet's Sunnah and biography",
      instructor: userLanguage === "ar" ? "د. محمد السعيد" : "Dr. Muhammad Al-Said",
      priceInSAR: 150,
      isFree: false,
      level: userLanguage === "ar" ? "متوسط" : "Intermediate",
      icon: "📚",
      lessons: 10,
      duration: userLanguage === "ar" ? "شهر و نصف" : "1.5 months",
    },
    {
      id: 3,
      title: userLanguage === "ar" ? "الفقه الإسلامي" : "Islamic Jurisprudence",
      description: userLanguage === "ar" 
        ? "أحكام الشرع الإسلامي في العبادات والمعاملات"
        : "Islamic legal rulings in worship and transactions",
      instructor: userLanguage === "ar" ? "الشيخ أحمد الشرقاوي" : "Sheikh Ahmad Al-Sharqawi",
      priceInSAR: 250,
      isFree: false,
      level: userLanguage === "ar" ? "متقدم" : "Advanced",
      icon: "⚖️",
      lessons: 15,
      duration: userLanguage === "ar" ? "شهرين" : "2 months",
    },
    {
      id: 4,
      title: userLanguage === "ar" ? "العقيدة الإسلامية" : "Islamic Creed",
      description: userLanguage === "ar" 
        ? "العقائد والمعتقدات الصحيحة"
        : "Correct Islamic beliefs and doctrines",
      instructor: userLanguage === "ar" ? "د. سارة الدين" : "Dr. Sarah Al-Din",
      priceInSAR: 100,
      isFree: false,
      level: userLanguage === "ar" ? "مبتدئ" : "Beginner",
      icon: "✨",
      lessons: 8,
      duration: userLanguage === "ar" ? "3 أسابيع" : "3 weeks",
    },
  ];

  const filteredCourses = courses.filter(course => {
    if (filter === "free") return course.isFree;
    if (filter === "paid") return !course.isFree;
    return true;
  });

  const isRTL = userLanguage === "ar";

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>⏳ {userLanguage === "ar" ? "جاري التحميل..." : "Loading..."}</div>;
  }

  return (
    <>
      <Navigation />
      <main style={{
        direction: isRTL ? "rtl" : "ltr",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "40px 20px",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #8e44ad 0%, #3498db 100%)",
            color: "white",
            padding: "30px 20px",
            borderRadius: "12px",
            marginBottom: "30px",
            textAlign: "center",
          }}>
            <h1 style={{
              fontSize: "36px",
              margin: "0 0 10px 0",
              fontWeight: "bold",
            }}>
              🎓 {userLanguage === "ar" ? "الكورسات الشرعية" : "Islamic Courses"}
            </h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {userLanguage === "ar"
                ? "تعلم من أفضل المحاضرين - مجاني ومدفوع"
                : "Learn from the best instructors - Free and Premium"}
            </p>
          </div>

          {/* Filter Buttons */}
          <div style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "10px 20px",
                backgroundColor: filter === "all" ? "#8e44ad" : "white",
                color: filter === "all" ? "white" : "#333",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
            >
              {userLanguage === "ar" ? "الكل" : "All"}
            </button>
            <button
              onClick={() => setFilter("free")}
              style={{
                padding: "10px 20px",
                backgroundColor: filter === "free" ? "#27ae60" : "white",
                color: filter === "free" ? "white" : "#333",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
            >
              🎁 {userLanguage === "ar" ? "مجاني" : "Free"}
            </button>
            <button
              onClick={() => setFilter("paid")}
              style={{
                padding: "10px 20px",
                backgroundColor: filter === "paid" ? "#e74c3c" : "white",
                color: filter === "paid" ? "white" : "#333",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
            >
              💰 {userLanguage === "ar" ? "مدفوع" : "Premium"}
            </button>
          </div>

          {/* Courses Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "25px",
          }}>
            {filteredCourses.map((course) => {
              const convertedPrice = convertPrice(course.priceInSAR, currency);
              const formattedPrice = formatPrice(convertedPrice, currency);

              return (
                <div
                  key={course.id}
                  style={{
                    backgroundColor: course.isFree ? "#f0fdf4" : "white",
                    borderRadius: "12px",
                    padding: "25px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    border: course.isFree ? "2px solid #27ae60" : "1px solid #ddd",
                    transition: "all 0.3s",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                  }}
                >
                  {course.isFree && (
                    <div style={{
                      position: "absolute",
                      top: "15px",
                      right: isRTL ? "15px" : "auto",
                      left: isRTL ? "auto" : "15px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      padding: "5px 15px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}>
                      🎁 {userLanguage === "ar" ? "مجاني" : "FREE"}
                    </div>
                  )}

                  <div style={{ fontSize: "40px", marginBottom: "15px", marginTop: course.isFree ? "30px" : "0" }}>
                    {course.icon}
                  </div>
                  <h3 style={{
                    fontSize: "22px",
                    color: "#1a3a52",
                    marginBottom: "10px",
                  }}>
                    {course.title}
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "15px",
                    lineHeight: "1.6",
                    minHeight: "60px",
                  }}>
                    {course.description}
                  </p>

                  <div style={{
                    borderTop: "1px solid #eee",
                    paddingTop: "15px",
                    marginTop: "15px",
                  }}>
                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                      👨‍🏫 {course.instructor}
                    </p>
                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                      📊 {userLanguage === "ar" ? "المستوى: " : "Level: "}<span style={{ color: "#1a3a52", fontWeight: "bold" }}>{course.level}</span>
                    </p>
                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                      📚 {userLanguage === "ar" ? "الدروس: " : "Lessons: "}<span style={{ color: "#1a3a52", fontWeight: "bold" }}>{course.lessons}</span>
                    </p>
                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
                      ⏱️ {userLanguage === "ar" ? "المدة: " : "Duration: "}<span style={{ color: "#1a3a52", fontWeight: "bold" }}>{course.duration}</span>
                    </p>
                  </div>

                  <div style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: course.isFree ? "#27ae60" : "#e74c3c",
                    marginBottom: "15px",
                  }}>
                    {course.isFree 
                      ? `🎁 ${userLanguage === "ar" ? "مجاني بالكامل" : "Completely Free"}`
                      : `💰 ${formattedPrice}/${userLanguage === "ar" ? "شهر" : "month"}`
                    }
                  </div>

                  <button style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: course.isFree ? "#27ae60" : "#1a3a52",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = course.isFree ? "#229954" : "#0d1f2d";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = course.isFree ? "#27ae60" : "#1a3a52";
                  }}
                  >
                    {course.isFree 
                      ? `${userLanguage === "ar" ? "ابدأ مجاناً" : "Start Free"}` 
                      : `${userLanguage === "ar" ? "اشترك الآن" : "Subscribe Now"}`
                    }
                  </button>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#666",
            }}>
              <p style={{ fontSize: "16px" }}>
                {userLanguage === "ar"
                  ? "لا توجد كورسات في هذه الفئة"
                  : "No courses in this category"}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
