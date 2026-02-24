"use client";

import Navigation from "@/app/components/Navigation";
import { useState, useEffect, useRef } from "react";
import { SURAHS, getSurahVerses, getSurah } from "@/app/lib/services/quranService";
import { detectUserLanguage, SupportedLanguage } from "@/app/lib/services/languageDetector";

interface ReadingResult {
  verse: string;
  userReading: string;
  accuracy: number;
  errors: string[];
  wordComparison: Array<{word: string, correct: boolean, userWord?: string}>;
}

interface WordColorState {
  [index: number]: "correct" | "incorrect" | "pending";
}

export default function QuranTutorPage() {
  const [userLanguage, setUserLanguage] = useState<SupportedLanguage>("ar");
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [readingResults, setReadingResults] = useState<ReadingResult[]>([]);
  const [wordStates, setWordStates] = useState<WordColorState>({});
  const [listeningProgress, setListeningProgress] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  const isRTL = userLanguage === "ar";

  useEffect(() => {
    const detectLanguage = async () => {
      const detected = (await detectUserLanguage()) as SupportedLanguage;
      setUserLanguage(detected);
    };
    detectLanguage();

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ar-SA';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      const MAX_NO_SPEECH_RETRIES = 2;
      const retriesRef = { current: 0 } as { current: number };

      recognitionRef.current.onstart = () => {
        retriesRef.current = 0;
        setIsListening(true);
        setRecognizedText("");
      };

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setRecognizedText(transcript);
            // Update word states based on current recognition
            if (currentVerse) {
              const originalWords = currentVerse.arabicText.split(/\s+/).filter((w: string) => w.length > 0);
              const recognizedWords = transcript.split(/\s+/).filter((w: string) => w.length > 0);
              const newStates: WordColorState = {};
              
              recognizedWords.forEach((userWord: string, index: number) => {
                if (originalWords[index] === userWord) {
                  newStates[index] = "correct";
                } else {
                  newStates[index] = "incorrect";
                }
              });
              
              setWordStates(newStates);
              setListeningProgress(recognizedWords);
            }
          } else {
            interim += transcript;
          }
        }
        if (interim) setRecognizedText(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        const err = event?.error || event;
        console.warn('Speech recognition error event:', err);

        // handle no-speech specifically with gentle retries
        if (err === 'no-speech' || err?.name === 'NoSpeechError') {
          retriesRef.current += 1;
          if (retriesRef.current <= MAX_NO_SPEECH_RETRIES) {
            // attempt a short retry
            setTimeout(() => {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Retry start failed:', e);
                setIsListening(false);
              }
            }, 600);
            return;
          }

          // if still failing after retries, inform user
          alert(userLanguage === 'ar'
            ? 'لم يتم التقاط أي صوت. حاول التحدث بصوت أوضح أو الاقتراب من الميكروفون.'
            : 'No speech detected. Please speak louder or move closer to the microphone.'
          );
        } else {
          alert(userLanguage === 'ar'
            ? `حدث خطأ أثناء التعرف على الصوت: ${String(err)}`
            : `Speech recognition error: ${String(err)}`
          );
        }

        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // cleanup on unmount
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
          recognitionRef.current = null;
        }
      } catch (e) {
        console.warn('Error during recognition cleanup:', e);
      }
    };
  }, []);

  const currentSurah = selectedSurah ? getSurah(selectedSurah) : null;
  const currentVerses = selectedSurah ? getSurahVerses(selectedSurah) : [];
  const currentVerse = currentVerses[currentVerseIndex];

  const handleStartListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const calculateAccuracy = (original: string, recognized: string): { accuracy: number; errors: string[]; wordComparison: Array<{word: string, correct: boolean, userWord?: string}> } => {
    const originalWords = original.split(/\s+/).filter(w => w.length > 0);
    const recognizedWords = recognized.split(/\s+/).filter(w => w.length > 0);
    const errors: string[] = [];
    const wordComparison: Array<{word: string, correct: boolean, userWord?: string}> = [];
    let correctWords = 0;

    originalWords.forEach((word, index) => {
      if (recognizedWords[index] && recognizedWords[index] === word) {
        correctWords++;
        wordComparison.push({ word, correct: true });
      } else {
        wordComparison.push({ word, correct: false, userWord: recognizedWords[index] || "❌ missing" });
        errors.push(`الكلمة ${index + 1}: متوقع "${word}", تم التعرف على "${recognizedWords[index] || 'مفقودة'}"`);
      }
    });

    if (recognizedWords.length > originalWords.length) {
      for (let i = originalWords.length; i < recognizedWords.length; i++) {
        errors.push(`كلمة إضافية: "${recognizedWords[i]}"`);
      }
    }

    const accuracy = Math.round((correctWords / originalWords.length) * 100);
    return { accuracy, errors, wordComparison };
  };

  const handleCheckReading = () => {
    if (!currentVerse || !recognizedText) {
      alert(userLanguage === "ar" ? "يرجى القراءة أولاً" : "Please read first");
      return;
    }

    const { accuracy, errors, wordComparison } = calculateAccuracy(currentVerse.arabicText, recognizedText);
    const result: ReadingResult = {
      verse: `${currentSurah?.nameAr} - الآية ${currentVerse.verseNumber}`,
      userReading: recognizedText,
      accuracy,
      errors: errors.slice(0, 3), // Show first 3 errors
      wordComparison,
    };

    setReadingResults([...readingResults, result]);
    
    // Move to next verse
    if (currentVerseIndex < currentVerses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
      setRecognizedText("");
      setWordStates({});
      setListeningProgress([]);
    } else {
      alert(userLanguage === "ar" 
        ? "تم الانتهاء من السورة! ممتاز عملك"
        : "Surah completed! Great job");
    }
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
          maxWidth: "1000px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
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
              🎤 {userLanguage === "ar" ? "برنامج تدريب القراءة" : "Quran Reading Tutor"}
            </h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {userLanguage === "ar"
                ? "اقرأ القرآن بصوت عالي والبرنامج سيصحح لك الأخطاء"
                : "Read Quran aloud and the app will correct your mistakes"}
            </p>
          </div>

          {!selectedSurah ? (
            // Surah Selection
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
                {userLanguage === "ar" ? "اختر سورة للتدريب" : "Select a Surah to Practice"}
              </h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "10px",
              }}>
                {SURAHS.map(surah => (
                  <button
                    key={surah.number}
                    onClick={() => {
                      setSelectedSurah(surah.number);
                      setCurrentVerseIndex(0);
                      setReadingResults([]);
                    }}
                    style={{
                      padding: "15px",
                      backgroundColor: "#f0f4f8",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#1a3a52", marginBottom: "5px" }}>
                      {surah.number}. {surah.nameAr}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {surah.versesCount} {userLanguage === "ar" ? "آية" : "verses"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Practice Section */}
              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginBottom: "20px",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}>
                  <h2 style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1a3a52",
                    margin: 0,
                  }}>
                    سورة {currentSurah?.nameAr}
                  </h2>
                  <div style={{
                    fontSize: "14px",
                    color: "#666",
                  }}>
                    {currentVerseIndex + 1} / {currentVerses.length}
                  </div>
                </div>

                {currentVerse && (
                  <>
                    {/* Original Verse with Word Highlighting */}
                    <div style={{
                      backgroundColor: "#f9f9f9",
                      padding: "20px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      direction: "rtl",
                    }}>
                      <h3 style={{
                        fontSize: "14px",
                        color: "#666",
                        margin: "0 0 15px 0",
                        textAlign: "right",
                      }}>
                        {userLanguage === "ar" ? "الآية التي ستقرأها:" : "Verse to Read:"}
                      </h3>
                      <div style={{
                        fontSize: "22px",
                        lineHeight: "2.5",
                        color: "#333",
                        textAlign: "center",
                        minHeight: "100px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {currentVerse.arabicText.split(/\s+/).map((word: string, index: number) => {
                          let wordColor = "#999"; // Dark gray for pending
                          let bgColor = "rgba(153, 153, 153, 0.1)"; // Light gray background
                          let fontWeight = "normal";

                          if (wordStates[index] === "correct") {
                            wordColor = "#27ae60"; // Green for correct
                            bgColor = "rgba(39, 174, 96, 0.15)";
                            fontWeight = "bold";
                          } else if (wordStates[index] === "incorrect") {
                            wordColor = "#e74c3c"; // Red for incorrect
                            bgColor = "rgba(231, 76, 60, 0.15)";
                            fontWeight = "bold";
                          }

                          return (
                            <span
                              key={index}
                              style={{
                                display: "inline-block",
                                padding: "8px 6px",
                                margin: "4px 2px",
                                borderRadius: "4px",
                                color: wordColor,
                                backgroundColor: bgColor,
                                transition: "all 0.3s ease",
                                fontWeight: fontWeight,
                                border: wordStates[index] ? `2px solid ${wordColor}` : "1px solid transparent",
                              }}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </div>
                      <div style={{
                        fontSize: "14px",
                        color: "#666",
                        textAlign: "center",
                        marginTop: "10px",
                      }}>
                        الآية {currentVerse.verseNumber}
                      </div>
                    </div>

                    {/* Recording Section */}
                    <div style={{
                      backgroundColor: isListening ? "#fff3cd" : "#f0f4f8",
                      padding: "20px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      textAlign: "center",
                      border: isListening ? "2px solid #ffc107" : "1px solid #ddd",
                    }}>
                      <button
                        onClick={handleStartListening}
                        disabled={isListening}
                        style={{
                          padding: "15px 30px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "white",
                          backgroundColor: isListening ? "#ffc107" : "#3498db",
                          border: "none",
                          borderRadius: "6px",
                          cursor: isListening ? "not-allowed" : "pointer",
                          marginBottom: "15px",
                          minWidth: "200px",
                        }}
                      >
                        {isListening ? "🎤 جاري الاستماع..." : "🎤 ابدأ القراءة"}
                      </button>

                      {recognizedText && (
                        <div style={{
                          backgroundColor: "white",
                          padding: "15px",
                          borderRadius: "6px",
                          marginBottom: "15px",
                          textAlign: "right",
                          direction: "rtl",
                        }}>
                          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                            {userLanguage === "ar" ? "ما تم التعرف عليه:" : "Recognized text:"}
                          </div>
                          <div style={{ fontSize: "16px", color: "#333" }}>
                            {recognizedText}
                          </div>
                        </div>
                      )}

                      {recognizedText && !isListening && (
                        <button
                          onClick={handleCheckReading}
                          style={{
                            padding: "12px 25px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "white",
                            backgroundColor: "#27ae60",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          ✓ {userLanguage === "ar" ? "تحقق من القراءة" : "Check Reading"}
                        </button>
                      )}
                    </div>

                    <div style={{
                      display: "flex",
                      gap: "10px",
                    }}>
                      <button
                        onClick={() => setSelectedSurah(null)}
                        style={{
                          flex: 1,
                          padding: "12px",
                          backgroundColor: "#95a5a6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        {userLanguage === "ar" ? "اختر سورة أخرى" : "Choose Another Surah"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Results */}
              {readingResults.length > 0 && (
                <div style={{
                  backgroundColor: "white",
                  padding: "25px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1a3a52",
                    marginTop: 0,
                  }}>
                    📊 {userLanguage === "ar" ? "نتائج التدريب" : "Training Results"}
                  </h3>

                  {readingResults.map((result, index) => (
                    <div key={index} style={{
                      backgroundColor: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "6px",
                      marginBottom: "15px",
                      borderRight: `4px solid ${result.accuracy >= 90 ? "#27ae60" : result.accuracy >= 70 ? "#f39c12" : "#e74c3c"}`,
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        alignItems: "center",
                      }}>
                        <div style={{ fontWeight: "bold", color: "#1a3a52" }}>
                          {result.verse}
                        </div>
                        <div style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: result.accuracy >= 90 ? "#27ae60" : result.accuracy >= 70 ? "#f39c12" : "#e74c3c",
                        }}>
                          {result.accuracy}%
                        </div>
                      </div>

                      {/* Word Comparison */}
                      <div style={{
                        backgroundColor: "white",
                        padding: "12px",
                        borderRadius: "4px",
                        marginBottom: "10px",
                        direction: "rtl",
                        textAlign: "right",
                      }}>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                          مقارنة الكلمات:
                        </div>
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}>
                          {result.wordComparison.map((item, wordIndex) => (
                            <span
                              key={wordIndex}
                              style={{
                                display: "inline-block",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                backgroundColor: item.correct ? "rgba(39, 174, 96, 0.2)" : "rgba(231, 76, 60, 0.2)",
                                color: item.correct ? "#27ae60" : "#e74c3c",
                                border: `1px solid ${item.correct ? "#27ae60" : "#e74c3c"}`,
                                fontWeight: "bold",
                              }}
                            >
                              {item.correct ? "✓" : "✗"} {item.word}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {result.errors.length > 0 && (
                        <div style={{
                          backgroundColor: "#fff9e6",
                          padding: "10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#666",
                        }}>
                          <strong>{userLanguage === "ar" ? "الأخطاء:" : "Errors:"}</strong>
                          <ul style={{ margin: "5px 0 0 20px", paddingLeft: 0 }}>
                            {result.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{
                    marginTop: "15px",
                    padding: "15px",
                    backgroundColor: "#f0f4f8",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}>
                    <strong style={{ color: "#1a3a52" }}>
                      {userLanguage === "ar" ? "متوسط الدقة: " : "Average Accuracy: "}
                      {Math.round(readingResults.reduce((sum, r) => sum + r.accuracy, 0) / readingResults.length)}%
                    </strong>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
