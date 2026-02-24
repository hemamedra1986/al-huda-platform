"use client";

import { useState } from "react";

export default function AudioTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingInternet, setIsTestingInternet] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  // Test internet connectivity
  const testInternet = async () => {
    setIsTestingInternet(true);
    const results = [];

    // Test 1: Google DNS
    try {
      const start = Date.now();
      const response = await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-store",
      });
      results.push({
        test: "Google DNS",
        status: "✅ يعمل",
        time: `${Date.now() - start}ms`,
      });
    } catch (error) {
      results.push({
        test: "Google DNS",
        status: "❌ معطل",
        error: String(error),
      });
    }

    // Test 2: Cloudflare DNS
    try {
      const start = Date.now();
      const response = await fetch("https://1.1.1.1/cdn-cgi/trace", {
        mode: "no-cors",
      });
      results.push({
        test: "Cloudflare",
        status: "✅ يعمل",
        time: `${Date.now() - start}ms`,
      });
    } catch (error) {
      results.push({
        test: "Cloudflare",
        status: "❌ معطل",
        error: String(error),
      });
    }

    setTestResults(results);
    setIsTestingInternet(false);
  };

  // Test audio sources
  const testAudioSources = async () => {
    setIsTestingAudio(true);
    const results = [];

    const audioSources = [
      {
        name: "QuranicAudio - Abdulbasit",
        url: "https://www.quranicaudio.com/quran_audio/mp3/sounds_abdulbasit_murattal/001.mp3",
      },
      {
        name: "EveryAyah - Alafasy 128kbps",
        url: "https://everyayah.com/data/Alafasy_128kbps/001.mp3",
      },
      {
        name: "Islamic Network CDN",
        url: "https://cdn.islamic.network/quran/audio-surah/128/001.mp3",
      },
      {
        name: "EveryAyah - Alafasy 64kbps",
        url: "https://everyayah.com/data/Alafasy_64kbps/001.mp3",
      },
    ];

    for (const source of audioSources) {
      try {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = source.url;

        const loadPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Timeout")),
            10000
          );

          audio.oncanplay = () => {
            clearTimeout(timeout);
            resolve(true);
          };

          audio.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Load error"));
          };

          audio.load();
        });

        await loadPromise;
        results.push({
          source: source.name,
          status: "✅ يعمل",
          size: audio.duration ? `${audio.duration.toFixed(0)}s` : "?",
        });
      } catch (error) {
        results.push({
          source: source.name,
          status: "❌ معطل",
          error: String(error),
        });
      }
    }

    setTestResults(results);
    setIsTestingAudio(false);
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1000px",
        margin: "0 auto",
        direction: "rtl",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#1a3a52", marginBottom: "30px" }}>
        🔧 اختبار الصوت والإنترنت
      </h1>

      {/* Internet Test Button */}
      <button
        onClick={testInternet}
        disabled={isTestingInternet}
        style={{
          padding: "12px 30px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: isTestingInternet ? "#ccc" : "#27ae60",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: isTestingInternet ? "wait" : "pointer",
          marginBottom: "20px",
        }}
      >
        {isTestingInternet ? "⏳ جاري الاختبار..." : "🌐 اختبر الإنترنت"}
      </button>

      {/* Audio Test Button */}
      <button
        onClick={testAudioSources}
        disabled={isTestingAudio}
        style={{
          padding: "12px 30px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: isTestingAudio ? "#ccc" : "#2980b9",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: isTestingAudio ? "wait" : "pointer",
          marginBottom: "20px",
          marginRight: "10px",
        }}
      >
        {isTestingAudio ? "⏳ جاري الاختبار..." : "🔊 اختبر مصادر الصوت"}
      </button>

      {/* Results */}
      {testResults.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#1a3a52", marginTop: 0 }}>📊 النتائج:</h2>

          {/* Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            {testResults.map((result, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor:
                    result.status === "✅ يعمل" ? "#d4edda" : "#f8d7da",
                  border:
                    result.status === "✅ يعمل"
                      ? "1px solid #28a745"
                      : "1px solid #dc3545",
                  borderRadius: "6px",
                  padding: "15px",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {result.test || result.source}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {result.status}
                </div>
                {result.time && (
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    ⏱️ {result.time}
                  </div>
                )}
                {result.error && (
                  <div style={{ fontSize: "11px", color: "#d32f2f" }}>
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "6px",
              padding: "15px",
              marginTop: "20px",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#856404" }}>💡 توصيات:</h3>
            <ul style={{ marginBottom: 0, color: "#856404" }}>
              <li>تأكد من تنشيط الإنترنت</li>
              <li>استخدم متصفح Chrome أو Edge</li>
              <li>تحديث المتصفح إلى أحدث إصدار</li>
              <li>تعطيل أي VPN أو Proxy</li>
              <li>مسح ذاكرة المتصفح (Cache)</li>
              <li>إعادة تحميل الصفحة (F5)</li>
            </ul>
          </div>

          {/* Detailed Results */}
          <details
            style={{
              marginTop: "20px",
              cursor: "pointer",
            }}
          >
            <summary style={{ fontWeight: "bold", color: "#1a3a52" }}>
              📋 التفاصيل الكاملة
            </summary>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "15px",
                borderRadius: "6px",
                overflow: "auto",
                marginTop: "10px",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Back Link */}
      <div style={{ marginTop: "30px" }}>
        <a
          href="/quran"
          style={{
            color: "#2980b9",
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          ← العودة إلى المصحف
        </a>
      </div>
    </div>
  );
}
