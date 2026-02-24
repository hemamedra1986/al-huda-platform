"use client";

import Navigation from "./components/Navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { detectUserLanguage, supportedLanguages, SupportedLanguage } from "./lib/services/languageDetector";

export default function Home() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectLanguage = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);
      setIsLoading(false);
    };
    detectLanguage();
  }, []);

  const isRTL = userLanguage === "ar";

  const features = [
    {
      id: 1,
      titleAr: "🎓 علوم شرعية",
      titleEn: "🎓 Islamic Sciences",
      descAr: "كورسات شرعية متخصصة مع محاضرات مباشرة",
      descEn: "Specialized Islamic courses with live lectures",
      link: "/courses",
      color: "#e8f5e9"
    },
    {
      id: 2,
      titleAr: "📞 استشارات",
      titleEn: "📞 Consultations",
      descAr: "استشارات خاصة مع متخصصين - احجز موعدك الآن",
      descEn: "Private consultations with specialists - Book your appointment",
      link: "/consultations",
      color: "#fff3e0"
    },
    {
      id: 3,
      titleAr: "🕌 تصحيح القرآن",
      titleEn: "🕌 Quran Correction",
      descAr: "تصحيح التلاوة ومتابعة الحفظ بتقنيات حديثة",
      descEn: "Correct your recitation and track your memorization",
      link: "/quran",
      color: "#f3e5f5"
    },
    {
      id: 4,
      titleAr: "🌐 غرف صوتية",
      titleEn: "🌐 Voice Rooms",
      descAr: "محادثات صوتية مباشرة مع ترجمة فورية",
      descEn: "Live voice conversations with instant translation",
      link: "/voice",
      color: "#e0f2f1"
    },
    {
      id: 5,
      titleAr: "💬 شات فوري",
      titleEn: "💬 Instant Chat",
      descAr: "شات حي مع متخصصين وترجمة فورية",
      descEn: "Live chat with experts and instant translation",
      link: "/chat",
      color: "#fce4ec"
    }
  ];

  const content = {
    ar: {
      title: "منصة الهُدى",
      subtitle: "منصة تعليمية إسلامية متكاملة لتحسين معرفتك الشرعية وحفظ القرآن",
      login: "ابدأ الاستشارة المجانية",
      features: "ميزاتنا الرئيسية",
      subscriptions: "خطط الاشتراك",
      subsDesc: "اختر الخطة المناسبة لك واستمتع بجميع الميزات",
      viewPlans: "عرض الخطط",
      autoDetected: "تم اكتشاف اللغة تلقائياً: العربية"
    },
    en: {
      title: "Al-Huda Platform",
      subtitle: "An integrated Islamic educational platform to improve your religious knowledge and memorize the Quran",
      login: "Start Free Consultation",
      features: "Our Main Features",
      subscriptions: "Subscription Plans",
      subsDesc: "Choose the right plan for you and enjoy all the features",
      viewPlans: "View Plans",
      autoDetected: "Language automatically detected: English"
    },
    fr: {
      title: "Plateforme Al-Huda",
      subtitle: "Une plateforme éducative islamique intégrée pour améliorer vos connaissances religieuses",
      login: "Se connecter avec Google",
      features: "Nos principales fonctionnalités",
      subscriptions: "Plans d'abonnement",
      subsDesc: "Choisissez le plan qui vous convient et profitez de toutes les fonctionnalités",
      viewPlans: "Voir les plans",
      autoDetected: "Langue détectée automatiquement: Français"
    },
    de: {
      title: "Al-Huda Plattform",
      subtitle: "Eine integrierte islamische Bildungsplattform zur Verbesserung Ihres religiösen Wissens",
      login: "Mit Google anmelden",
      features: "Unsere Hauptmerkmale",
      subscriptions: "Abonnementpläne",
      subsDesc: "Wählen Sie den richtigen Plan für Sie und genießen Sie alle Funktionen",
      viewPlans: "Pläne anzeigen",
      autoDetected: "Sprache automatisch erkannt: Deutsch"
    },
    es: {
      title: "Plataforma Al-Huda",
      subtitle: "Una plataforma educativa islámica integrada para mejorar tu conocimiento religioso",
      login: "Iniciar sesión con Google",
      features: "Nuestras características principales",
      subscriptions: "Planes de suscripción",
      subsDesc: "Elige el plan adecuado para ti y disfruta de todas las características",
      viewPlans: "Ver planes",
      autoDetected: "Idioma detectado automáticamente: Español"
    }
  };

  const text = content[userLanguage] || content.en;

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "24px",
      }}>
        ⏳ جاري تحميل الموقع...
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main style={{
        direction: isRTL ? "rtl" : "ltr",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}>
        {/* تنبيه تحديد اللغة */}
        <div style={{
          backgroundColor: "#ffd700",
          color: "#1a3a52",
          padding: "10px 30px",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "bold",
        }}>
          🌍 {text.autoDetected}
        </div>

        {/* القسم الأول - البطل */}
        <section style={{
          backgroundColor: "#1a3a52",
          color: "white",
          padding: "80px 30px",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>{text.title}</h1>
          <p style={{ fontSize: "20px", marginBottom: "30px" }}>
            {text.subtitle}
          </p>
          <Link href="/consultations" style={{ textDecoration: "none" }}>
            <button style={{
              padding: "15px 40px",
              fontSize: "18px",
              backgroundColor: "#ffd700",
              color: "#1a3a52",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "0.3s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
            >
              {text.login}
            </button>
          </Link>
        </section>

        {/* القسم الثاني - الميزات */}
        <section style={{ padding: "60px 30px" }}>
          <h2 style={{
            fontSize: "36px",
            textAlign: "center",
            marginBottom: "50px",
            color: "#1a3a52"
          }}>
            {text.features}
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
            maxWidth: "1200px",
            margin: "0 auto"
          }}>
            {features.map((feature) => (
              <Link 
                key={feature.id}
                href={feature.link}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{
                  backgroundColor: feature.color,
                  padding: "30px",
                  borderRadius: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "0.3s",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  minHeight: "250px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow = "0 8px 12px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
                >
                  <h3 style={{ fontSize: "28px", marginBottom: "15px", color: "#1a3a52" }}>
                    {isRTL ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p style={{ fontSize: "16px", color: "#555", lineHeight: "1.6" }}>
                    {isRTL ? feature.descAr : feature.descEn}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* القسم الثالث - حول الاشتراكات */}
        <section style={{
          backgroundColor: "#1a3a52",
          color: "white",
          padding: "60px 30px",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: "36px", marginBottom: "30px" }}>{text.subscriptions}</h2>
          <p style={{ fontSize: "18px", marginBottom: "20px" }}>
            {text.subsDesc}
          </p>
          <Link href="/subscriptions" style={{
            backgroundColor: "#ffd700",
            color: "#1a3a52",
            padding: "12px 30px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
            display: "inline-block",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
          >
            {text.viewPlans}
          </Link>
        </section>
      </main>
    </>
  );
}