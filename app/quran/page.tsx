"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect, useRef } from "react";
import { SURAHS, RECITERS, getSurahVerses, getSurah, Reciter } from "@/app/lib/services/quranService";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";
import Link from "next/link";
import getAudioSources from "@/app/lib/quranAudioLibrary";

export default function QuranPage() {
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<string>(RECITERS[0].id);
  const [searchSurah, setSearchSurah] = useState("");
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [attemptLog, setAttemptLog] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const detectLanguage = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);
    };
    detectLanguage();
  }, []);

  const isRTL = userLanguage === "ar";

  const filteredSurahs = SURAHS.filter(surah =>
    surah.nameAr.includes(searchSurah) ||
    surah.nameEn.toLowerCase().includes(searchSurah.toLowerCase()) ||
    surah.number.toString() === searchSurah
  );

  const currentSurah = selectedSurah ? getSurah(selectedSurah) : null;
  const currentVerses = selectedSurah ? getSurahVerses(selectedSurah) : [];
  const currentReciter = RECITERS.find(r => r.id === selectedReciter);

  const playTestSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);

      alert(
        userLanguage === "ar"
          ? `✅ تم تشغيل صوت اختبار\n\n✓ الصوت يعمل بنجاح!\n\n🔧 إذا كنت تسمع صوت\nفالمشكلة في مصادر الصوت الخارجية\n\nاضغط على زر "استمع" لتشغيل القرآن`
          : `✅ Test sound played\n\n✓ Audio is working!\n\n🔧 If you hear sound\nthe issue is with external sources\n\nClick "Listen" to play Quran`
      );
    } catch (error) {
      alert(
        userLanguage === "ar"
          ? `❌ خطأ في توليد الصوت\n\nالمتصفح قد لا يدعم Web Audio API\n\nجرب:\n• تحديث المتصفح\n• استخدام Chrome أو Edge\n• تعطيل VPN`
          : `❌ Error generating sound\n\nBrowser may not support Web Audio API\n\nTry:\n• Update your browser\n• Use Chrome or Edge\n• Disable VPN`
      );
    }
  };

  const handlePlayAudio = () => {
    if (!currentReciter || !currentSurah) return;
    
    if (isPlaying) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setIsPlaying(false);
      setIsLoadingAudio(false);
      return;
    }

    const surahNumber = currentSurah.number;
    
    // Get candidate sources from centralized library
    const audioSources = getAudioSources(currentReciter.id, surahNumber);
    // Add proxy API as final fallback
    audioSources.push(`/api/proxy-audio?surah=${surahNumber}&reciter=${currentReciter.id}`);

    // create fresh audio element and store in ref
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current.src = "";
      audioRef.current = null;
    }
    audioRef.current = new Audio();
    // Do NOT set crossOrigin="anonymous" — many Quran CDNs don't send CORS headers,
    // which causes the browser to block the audio. We only need to play, not process.
    setIsLoadingAudio(true);

    let currentSourceIndex = 0;
    let loadAttempts = 0;
    const maxLoadAttempts = 6; // reasonable retries per source
    
    const playNextSource = () => {
      if (currentSourceIndex < audioSources.length) {
        const source = audioSources[currentSourceIndex];
        const audio = audioRef.current!;
        setAttemptLog(prev => [...prev, `Trying ${source}`]);
        console.log(`🔊 محاولة مصدر ${currentSourceIndex + 1}/${audioSources.length}: ${source}`);
        console.log(`🔊 محاولة مصدر ${currentSourceIndex + 1}/${audioSources.length}: ${source}`);

        // cleanup previous listeners by cloning element
        try {
          audio.pause();
        } catch (e) {}
        audio.src = source;
        audio.load();
        currentSourceIndex++;
        loadAttempts = 0;

        const timeout = setTimeout(() => {
          console.warn(`⏱️ انتهت مهلة الانتظار (10 ثوان)، جاري المحاولة التالية...`);
          setLastError(prev => `Timeout for ${source}`);
          setAttemptLog(prev => [...prev, `Timeout ${source}`]);
          playNextSource();
        }, 10000);

        const handleCanPlay = () => {
          clearTimeout(timeout);
          console.log(`✅ تم تحميل الصوت! جاري التشغيل...`);
          setIsLoadingAudio(false);
          audio.play()
            .then(() => {
              console.log(`✅ بدأ التشغيل بنجاح`);
            })
            .catch((error) => {
              console.warn(`⚠️ خطأ في التشغيل:`, error);
              setLastError(String(error));
              setAttemptLog(prev => [...prev, `Play error ${source}: ${String(error)}`]);
              playNextSource();
            });
        };

        const handleError = () => {
          clearTimeout(timeout);
          loadAttempts++;
          console.warn(`⚠️ حدث خطأ عند تحميل المصدر (${source})`);
          setLastError(`load error for ${source}`);
          setAttemptLog(prev => [...prev, `Load error ${source}`]);

          if (loadAttempts < maxLoadAttempts) {
            setAttemptLog(prev => [...prev, `Retry ${loadAttempts}/${maxLoadAttempts} for ${source}`]);
            setTimeout(() => {
              try { audio.load(); } catch (e) {}
            }, 500);
          } else {
            console.warn(`❌ فشل تحميل هذا المصدر بعد ${maxLoadAttempts} محاولات`);
            playNextSource();
          }
        };

        audio.addEventListener('canplay', handleCanPlay, { once: true });
        audio.addEventListener('error', handleError, { once: true });
      } else {
        // جميع المصادر فشلت
        setIsPlaying(false);
        setIsLoadingAudio(false);
        console.error(`❌ فشل تحميل الصوت من جميع المصادر`);
        setAttemptLog(prev => [...prev, `All sources failed: ${audioSources.join(', ')}`]);
        
        const errorMsg =
          userLanguage === "ar"
            ? `❌ لم نتمكن من تشغيل الصوت

الحلول المقترحة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ تحقق من الإنترنت:
   • فتح موقع Google أو Facebook
   • تأكد من سرعة الاتصال
   • أعد تشغيل جهاز التوجيه

2️⃣ نظف المتصفح:
   • امسح ذاكرة التخزين (Cache):
     Ctrl+Shift+Delete
   • أعد تحميل الصفحة: F5
   • أغلق التبويبات الأخرى

3️⃣ جرب صوت الاختبار:
   • اضغط على زر "🔊 اختبار الصوت"
   • إذا سمعت صوت ✓
     المشكلة في الإنترنت أو الخوادم

4️⃣ معلومات إضافية:
   • استخدم Chrome أو Edge
   • حدّث المتصفح لأحدث إصدار
   • عطّل أي VPN أو Proxy
   • حاول من موقع Wi-Fi مختلف

5️⃣ لا يزال لا يعمل؟
   • اذهب إلى /audio-test
   • انتظر قليلاً وحاول لاحقاً
   • اتصل بالدعم الفني`
            : `❌ Couldn't play audio

Suggested solutions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Check your internet:
   • Visit Google or Facebook
   • Check connection speed
   • Restart your router

2️⃣ Clear browser data:
   • Clear cache & cookies:
     Ctrl+Shift+Delete
   • Refresh page: F5
   • Close other tabs

3️⃣ Test audio:
   • Click "🔊 Test Sound"
   • If you hear sound ✓
     Problem is internet/servers

4️⃣ Additional info:
   • Use Chrome or Edge
   • Update your browser
   • Disable VPN/Proxy
   • Try different Wi-Fi

5️⃣ Still not working?
   • Go to /audio-test
   • Wait and try later
   • Contact support`;

        alert(errorMsg);
      }
    };

    if (audioRef.current) {
      audioRef.current.onended = () => {
        console.log(`✅ انتهى التشغيل`);
        setIsPlaying(false);
        setIsLoadingAudio(false);
        try { audioRef.current!.src = ""; } catch (e) {}
        audioRef.current = null;
      };
    }
    
    console.log(`🎵 بدء تشغيل سورة ${currentSurah.nameAr} (رقم: ${surahNumber})`);
    setIsPlaying(true);
    playNextSource();
  };

  return (
    <>
      <Navigation />
      <main style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "20px",
        direction: isRTL ? "rtl" : "ltr",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1a3a52 0%, #2d5a7a 100%)",
            color: "white",
            padding: "40px 20px",
            borderRadius: "12px",
            textAlign: "center",
            marginBottom: "30px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}>
            <h1 style={{
              fontSize: "36px",
              margin: "0 0 10px 0",
              fontWeight: "bold",
            }}>
              📖 {userLanguage === "ar" ? "المصحف الكريم" : "The Holy Quran"}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: "16px" }}>
              {userLanguage === "ar" 
                ? "استمع واقرأ القرآن الكريم بأصوات القراء المشهورين"
                : "Listen and read the Quran with renowned reciters"}
            </p>
          </div>

          {/* Reciter Selection */}
          <div style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#1a3a52",
              marginTop: 0,
              marginBottom: "15px",
            }}>
              🎙️ {userLanguage === "ar" ? "اختر القارئ" : "Select a Reciter"}
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}>
              {RECITERS.map(reciter => (
                <div
                  key={reciter.id}
                  onClick={() => setSelectedReciter(reciter.id)}
                  style={{
                    padding: "15px",
                    border: selectedReciter === reciter.id ? "2px solid #1a3a52" : "1px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: selectedReciter === reciter.id ? "#f0f4f8" : "#fff",
                    transition: "all 0.3s",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{reciter.image}</div>
                  <div style={{ fontWeight: "bold", color: "#1a3a52", marginBottom: "5px" }}>
                    {reciter.nameAr}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                    {reciter.nameEn}
                  </div>
                  <div style={{ fontSize: "13px", color: "#f39c12" }}>
                    ⭐ {reciter.rating}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                    {reciter.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "25px" }}>
            {/* Surahs List */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              height: "fit-content",
              position: "sticky",
              top: "20px",
            }}>
              <h2 style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#1a3a52",
                marginTop: 0,
              }}>
                {userLanguage === "ar" ? "السور" : "Surahs"}
              </h2>
              <input
                type="text"
                placeholder={userLanguage === "ar" ? "ابحث..." : "Search..."}
                value={searchSurah}
                onChange={(e) => setSearchSurah(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />
              <div style={{
                maxHeight: "600px",
                overflowY: "auto",
              }}>
                {filteredSurahs.map(surah => (
                  <div
                    key={surah.number}
                    onClick={() => {
                      setSelectedSurah(surah.number);
                      setCurrentVerse(1);
                    }}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: selectedSurah === surah.number ? "#1a3a52" : "#f9f9f9",
                      color: selectedSurah === surah.number ? "#fff" : "#333",
                      transition: "all 0.2s",
                      fontSize: "14px",
                      fontWeight: selectedSurah === surah.number ? "bold" : "normal",
                    }}
                  >
                    <div>{surah.number}. {surah.nameAr}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>
                      ({surah.versesCount} {userLanguage === "ar" ? "آية" : "verses"})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div>
              {selectedSurah && currentSurah && currentReciter ? (
                <>
                  {/* Surah Info */}
                  <div style={{
                    backgroundColor: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    marginBottom: "25px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{
                      fontSize: "32px",
                      color: "#1a3a52",
                      margin: "0 0 10px 0",
                      textAlign: "center",
                    }}>
                      سورة {currentSurah.nameAr}
                    </h3>
                    <p style={{
                      textAlign: "center",
                      color: "#666",
                      marginTop: 0,
                      fontSize: "14px",
                    }}>
                      {currentSurah.nameEn} • {currentSurah.versesCount} {userLanguage === "ar" ? "آية" : "verses"} • {currentSurah.revelationType}
                    </p>

                    {/* Audio Player */}
                    <div style={{
                      display: "flex",
                      gap: "15px",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: "20px",
                      padding: "20px",
                      backgroundColor: "#f0f4f8",
                      borderRadius: "8px",
                      flexWrap: "wrap",
                    }}>
                      <button
                        onClick={handlePlayAudio}
                        style={{
                          padding: "12px 30px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "white",
                          backgroundColor: isPlaying ? "#e74c3c" : isLoadingAudio ? "#f39c12" : "#27ae60",
                          border: "none",
                          borderRadius: "6px",
                          cursor: isLoadingAudio ? "wait" : "pointer",
                          transition: "all 0.3s",
                        }}
                        disabled={isLoadingAudio && !isPlaying}
                      >
                        {isPlaying ? "⏸ توقف" : isLoadingAudio ? "⏳ جاري التحميل..." : "▶️ استمع"}
                      </button>
                      
                      {/* Test Sound Button */}
                      <button
                        onClick={() => playTestSound()}
                        style={{
                          padding: "12px 20px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "white",
                          backgroundColor: "#9b59b6",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.3s",
                        }}
                        title={userLanguage === "ar" ? "اختبر الصوت - لا يحتاج إنترنت" : "Test sound - no internet needed"}
                      >
                        🔊 {userLanguage === "ar" ? "اختبار الصوت" : "Test Sound"}
                      </button>
                      
                      <div style={{ color: "#666", fontSize: "13px" }}>
                        🎤 {userLanguage === "ar" ? "بصوت" : "by"} {currentReciter.nameAr}
                      </div>
                    </div>
                    {/* Diagnostic log (visible when playback problems occur) */}
                    {attemptLog.length > 0 && (
                      <div style={{ marginTop: 12, background: '#fff6f6', padding: 12, borderRadius: 8, border: '1px solid #f5c6cb' }}>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#b71c1c' }}>{userLanguage === 'ar' ? 'تشخيص الصوت' : 'Audio Diagnostics'}</div>
                        <div style={{ fontSize: 12, color: '#333', marginTop: 6 }}>
                          {attemptLog.slice(-6).map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                        {lastError && <div style={{ marginTop: 8, color: '#b71c1c', fontSize: 12 }}>{lastError}</div>}
                      </div>
                    )}
                  </div>

                  {/* Verses */}
                  <div style={{
                    backgroundColor: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    marginBottom: "25px",
                  }}>
                    <h4 style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#1a3a52",
                      marginTop: 0,
                    }}>
                      {userLanguage === "ar" ? "الآيات" : "Verses"}
                    </h4>
                    <div style={{ direction: "rtl" }}>
                      {currentVerses.map(verse => (
                        <div
                          key={verse.verseNumber}
                          style={{
                            padding: "15px",
                            marginBottom: "10px",
                            backgroundColor: "#f9f9f9",
                            borderRadius: "6px",
                            borderRight: "4px solid #1a3a52",
                            fontSize: "18px",
                            lineHeight: "2",
                            color: "#333",
                          }}
                        >
                          <span style={{
                            color: "#1a3a52",
                            fontWeight: "bold",
                            float: "right",
                            marginLeft: "10px",
                          }}>
                            ﴿{verse.verseNumber}﴾
                          </span>
                          {verse.arabicText}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}>
                    <Link href="/quran-tutor" style={{
                      padding: "15px",
                      backgroundColor: "#3498db",
                      color: "white",
                      textAlign: "center",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      transition: "all 0.3s",
                    }}>
                      🎤 {userLanguage === "ar" ? "تدريب القراءة" : "Reading Tutor"}
                    </Link>
                    <Link href="/quran-booking" style={{
                      padding: "15px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      textAlign: "center",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      transition: "all 0.3s",
                    }}>
                      📅 {userLanguage === "ar" ? "احجز مع الشيخ" : "Book with Sheikh"}
                    </Link>
                  </div>
                </>
              ) : (
                <div style={{
                  backgroundColor: "white",
                  padding: "40px",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: "#666",
                }}>
                  <p style={{ fontSize: "16px" }}>
                    {userLanguage === "ar" 
                      ? "اختر سورة من القائمة لبدء الاستماع"
                      : "Select a Surah from the list to start listening"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
