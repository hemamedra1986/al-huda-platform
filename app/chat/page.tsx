"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useRef, useEffect } from "react";
import { translateText, supportedLanguagesForTranslation } from "@/app/lib/services/translationService";
import { detectUserLanguage, supportedLanguages, SupportedLanguage } from "@/app/lib/services/languageDetector";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { saveMessage } from "@/app/lib/services/firestoreService";
import { subscribeToAuth } from "@/app/lib/services/authService";

interface Message {
  id: string;
  sender: "user" | "specialist";
  text: string;
  translatedText?: string;
  originalLanguage: string;
  timestamp: Date;
  senderName: string;
  avatar: string;
}

export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "specialist",
      text: "السلام عليكم ورحمة الله وبركاته، كيف يمكنني مساعدتك؟",
      originalLanguage: "ar",
      timestamp: new Date(),
      senderName: "الشيخ أحمد",
      avatar: "👨‍🎓",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("ar");
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // تحديد اللغة عند التحميل
  useEffect(() => {
    const detectLanguage = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setSelectedLanguage(detected);
    };
    detectLanguage();

    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUserId(user?.uid || "");
    });

    return () => unsubscribe();
  }, []);

  // التمرير إلى آخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputMessage,
      originalLanguage: selectedLanguage,
      timestamp: new Date(),
      senderName: "أنت",
      avatar: "👤",
    };

    setMessages((prev) => [...prev, newMessage]);
    if (currentUserId) {
      await saveMessage({
        userId: currentUserId,
        roomId: "general-chat",
        senderRole: "user",
        text: newMessage.text,
        language: selectedLanguage,
      });
    }
    setInputMessage("");
    setIsLoading(true);

    // محاكاة رد من المتخصص
    setTimeout(() => {
      const responses: { [key: string]: string } = {
        ar: "شكراً على سؤالك، هذا موضوع مهم جداً. دعني أشرح لك بالتفصيل...",
        en: "Thank you for your question. This is a very important topic. Let me explain in detail...",
        fr: "Merci pour votre question. C'est un sujet très important. Laissez-moi vous l'expliquer en détail...",
      };

      const specialistMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "specialist",
        text: responses[selectedLanguage] || responses.ar,
        originalLanguage: "ar",
        timestamp: new Date(),
        senderName: "الشيخ أحمد",
        avatar: "👨‍🎓",
      };

      setMessages((prev) => [...prev, specialistMessage]);
      if (currentUserId) {
        saveMessage({
          userId: currentUserId,
          roomId: "general-chat",
          senderRole: "specialist",
          text: specialistMessage.text,
          language: specialistMessage.originalLanguage,
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleTranslateMessage = async (messageId: string) => {
    setTranslatingMessageId(messageId);
    const message = messages.find((m) => m.id === messageId);

    if (!message || message.translatedText) {
      setTranslatingMessageId(null);
      return;
    }

    try {
      const targetLang = selectedLanguage === "ar" ? "en" : "ar";
      const result = await translateText(message.text, targetLang, message.originalLanguage);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, translatedText: result.translatedText } : m
        )
      );
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setTranslatingMessageId(null);
    }
  };

  return (
    <ProtectedRoute allowGuest>
      <>
      <Navigation />
      <main
        style={{
          direction: selectedLanguage === "ar" ? "rtl" : "ltr",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          padding: "20px",
        }}
      >
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 100px)",
          }}
        >
          {/* رأس الشات */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px 12px 0 0",
              padding: "20px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              marginBottom: "0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ fontSize: "24px", color: "#1a3a52", marginBottom: "5px" }}>
                💬 الشات الحي مع المتخصصين
              </h1>
              <p style={{ fontSize: "14px", color: "#888" }}>مع الشيخ أحمد - متاح الآن</p>
            </div>

            {/* اختيار اللغة */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", color: "#1a3a52" }}>
                التعليق باللغة:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  cursor: "pointer",
                  backgroundColor: "white",
                }}
              >
                {Object.entries(supportedLanguages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowTranslation(!showTranslation)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: showTranslation ? "#1a3a52" : "#ddd",
                  color: showTranslation ? "white" : "#333",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                🌐 ترجمة {showTranslation ? "مفعلة" : "معطلة"}
              </button>
            </div>
          </div>

          {/* منطقة الرسائل */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              backgroundColor: "#f9f9f9",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent: message.sender === "user" ? "flex-start" : "flex-end",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: message.sender === "user" ? "row" : "row-reverse",
                    gap: "10px",
                    maxWidth: "70%",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ fontSize: "30px" }}>{message.avatar}</div>

                  <div>
                    <div
                      style={{
                        backgroundColor: message.sender === "user" ? "#1a3a52" : "#e8f5e9",
                        color: message.sender === "user" ? "white" : "#333",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        direction: "inherit",
                      }}
                    >
                      <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "bold" }}>
                        {message.senderName}
                      </p>
                      <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.5" }}>
                        {message.text}
                      </p>

                      {showTranslation && message.translatedText && (
                        <div
                          style={{
                            marginTop: "10px",
                            paddingTop: "10px",
                            borderTop: "1px solid rgba(0,0,0,0.1)",
                            fontSize: "12px",
                            fontStyle: "italic",
                            opacity: 0.8,
                          }}
                        >
                          🌐 <strong>الترجمة:</strong> {message.translatedText}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "5px", display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handleTranslateMessage(message.id)}
                        disabled={translatingMessageId === message.id}
                        style={{
                          fontSize: "12px",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#1a3a52",
                          cursor: translatingMessageId === message.id ? "wait" : "pointer",
                          textDecoration: "underline",
                          padding: "0",
                        }}
                      >
                        {translatingMessageId === message.id ? "⏳ جاري..." : "🌐 ترجمة"}
                      </button>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        {message.timestamp.toLocaleTimeString("ar-SA")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <div style={{ fontSize: "30px" }}>👨‍🎓</div>
                <div
                  style={{
                    backgroundColor: "#e8f5e9",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  <span style={{ animation: "bounce 1.4s infinite" }}>●</span>
                  <span style={{ animation: "bounce 1.4s infinite 0.2s" }}>●</span>
                  <span style={{ animation: "bounce 1.4s infinite 0.4s" }}>●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* مربع الإدخال */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0 0 12px 12px",
              padding: "20px",
              boxShadow: "0 -4px 8px rgba(0,0,0,0.1)",
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="اكتب رسالتك هنا..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "14px",
                direction: selectedLanguage === "ar" ? "rtl" : "ltr",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                padding: "12px 24px",
                backgroundColor: "#1a3a52",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: isLoading ? "wait" : "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              📤 إرسال
            </button>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      </>
    </ProtectedRoute>
  );
}
