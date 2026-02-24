"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/app/components/Navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import {
  DEFAULT_PLATFORM_SETTINGS,
  ChatMessageRecord,
  hasPaidConsultationAccess,
  saveMessage,
  subscribeToPlatformSettings,
  subscribeToUserMessages,
  uploadVoiceMessageAndSave,
} from "@/app/lib/services/firestoreService";
import { getOrCreateGuestSession } from "@/app/lib/services/guestSessionService";

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceSending, setVoiceSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [error, setError] = useState("");
  const [allowTextMessages, setAllowTextMessages] = useState(DEFAULT_PLATFORM_SETTINGS.messaging.allowTextMessages);
  const [allowVoiceMessages, setAllowVoiceMessages] = useState(DEFAULT_PLATFORM_SETTINGS.messaging.allowVoiceMessages);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const guest = getOrCreateGuestSession();
    setUserId(guest.userId);
  }, []);

  useEffect(() => {
    if (!userId) {
      setCheckingAccess(false);
      setHasPaidAccess(false);
      return;
    }

    const verifyAccess = async () => {
      setCheckingAccess(true);
      try {
        const allowed = await hasPaidConsultationAccess(userId);
        setHasPaidAccess(allowed);
      } catch {
        setHasPaidAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    verifyAccess();
  }, [userId]);

  useEffect(() => {
    const unsubscribeSettings = subscribeToPlatformSettings((settings) => {
      setAllowTextMessages(settings.messaging.allowTextMessages);
      setAllowVoiceMessages(settings.messaging.allowVoiceMessages);
    });

    return () => unsubscribeSettings();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribeMessages = subscribeToUserMessages(userId, (rows) => {
      setMessages(rows);
    });

    return () => unsubscribeMessages();
  }, [userId]);

  const userSentMessagesCount = useMemo(
    () => messages.filter((message) => message.senderRole === "user").length,
    [messages],
  );

  const remainingFreeMessages = Math.max(0, 10 - userSentMessagesCount);
  const canSendMessages = hasPaidAccess || remainingFreeMessages > 0;

  useEffect(() => {
    if (!userId) return;
    if (hasPaidAccess) return;
    if (remainingFreeMessages > 0) return;

    const refreshAccess = async () => {
      try {
        const allowed = await hasPaidConsultationAccess(userId);
        setHasPaidAccess(allowed);
      } catch {
        setHasPaidAccess(false);
      }
    };

    refreshAccess();
  }, [userId, hasPaidAccess, remainingFreeMessages]);

  const orderedMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSend = async () => {
    setError("");
    if (!allowTextMessages) {
      setError("الرسائل الكتابية معطلة حالياً بواسطة الإدارة.");
      return;
    }
    if (!canSendMessages) {
      setError("انتهت الرسائل المجانية. أكمل الدفع أو انتظر تفعيل الأدمن.");
      return;
    }
    if (!text.trim() || !userId) return;

    setSending(true);
    try {
      await saveMessage({
        userId,
        senderId: userId,
        roomId: `user-${userId}`,
        senderRole: "user",
        text: text.trim(),
        language: "ar",
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    setError("");
    if (!allowVoiceMessages) {
      setError("الرسائل الصوتية معطلة حالياً بواسطة الإدارة.");
      return;
    }
    if (!canSendMessages) {
      setError("انتهت الرسائل المجانية. أكمل الدفع أو انتظر تفعيل الأدمن.");
      return;
    }
    if (!userId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const recordedBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        if (!recordedBlob.size || !userId) {
          setIsRecording(false);
          return;
        }

        setVoiceSending(true);
        try {
          await uploadVoiceMessageAndSave({
            userId,
            senderId: userId,
            roomId: `user-${userId}`,
            senderRole: "user",
            language: "ar",
            blob: recordedBlob,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "فشل إرسال الرسالة الصوتية");
        } finally {
          setVoiceSending(false);
          setIsRecording(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setError("تعذر الوصول للميكروفون");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <ProtectedRoute allowGuest>
      <>
        <Navigation />
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "#f5f5f5",
            direction: "rtl",
            padding: "24px",
          }}
        >
          <section
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h1 style={{ marginTop: 0, color: "#1a3a52" }}>صفحة الرسائل</h1>
            <p style={{ color: "#666" }}>أرسل رسالتك، وسيقوم الأدمن بالرد هنا.</p>

            {checkingAccess ? (
              <p style={{ color: "#666" }}>⏳ جاري التحقق من صلاحية فتح الشات...</p>
            ) : null}

            {!checkingAccess && !hasPaidAccess ? (
              <div style={{ backgroundColor: "#fff3e0", color: "#8a4b00", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
                لديك أول 10 رسائل مجاناً. المتبقي الآن: {remainingFreeMessages}. بعد ذلك يلزم الدفع أو تفعيل الأدمن.
              </div>
            ) : null}

            {hasPaidAccess ? (
              <div style={{ backgroundColor: "#e8f5e9", color: "#1b5e20", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
                ✅ تم تفعيل الوصول الكامل للرسائل.
              </div>
            ) : null}

            {!allowTextMessages || !allowVoiceMessages ? (
              <div style={{ backgroundColor: "#fff3e0", color: "#8a4b00", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
                إعدادات الإدارة الحالية: {allowTextMessages ? "الرسائل الكتابية مفعلة" : "الرسائل الكتابية معطلة"} — {allowVoiceMessages ? "الرسائل الصوتية مفعلة" : "الرسائل الصوتية معطلة"}
              </div>
            ) : null}

            <div
              style={{
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "12px",
                minHeight: "320px",
                maxHeight: "420px",
                overflowY: "auto",
                backgroundColor: "#fafafa",
                display: "grid",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              {orderedMessages.length === 0 ? (
                <p style={{ color: "#777" }}>لا توجد رسائل بعد.</p>
              ) : (
                orderedMessages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      justifySelf: message.senderRole === "user" ? "start" : "end",
                      backgroundColor: message.senderRole === "user" ? "#e8f0ff" : "#e8f5e9",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      maxWidth: "75%",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                      {message.senderRole === "user" ? "أنت" : "الأدمن"}
                    </div>
                    {message.messageType === "audio" && message.audioUrl ? (
                      <audio controls src={message.audioUrl} style={{ maxWidth: "100%" }} />
                    ) : (
                      <div>{message.text}</div>
                    )}
                    {message.senderRole === "user" ? (
                      <div style={{ fontSize: "11px", color: "#777", marginTop: "5px" }}>
                        الحالة: {message.status === "replied" ? "تم الرد" : "جديد"}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="اكتب رسالتك..."
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                disabled={!canSendMessages || !allowTextMessages}
              />
              <button
                onClick={handleSend}
                disabled={!canSendMessages || !allowTextMessages || sending || voiceSending || !text.trim()}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "0 18px",
                  backgroundColor: "#1a3a52",
                  color: "white",
                  fontWeight: "bold",
                  cursor: sending ? "wait" : "pointer",
                }}
              >
                {sending ? "جاري..." : "إرسال"}
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!canSendMessages || !allowVoiceMessages || voiceSending || sending}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "0 14px",
                  backgroundColor: isRecording ? "#d32f2f" : "#2e7d32",
                  color: "white",
                  fontWeight: "bold",
                  cursor: voiceSending ? "wait" : "pointer",
                }}
              >
                {voiceSending ? "رفع..." : isRecording ? "إيقاف" : "🔊 تسجيل"}
              </button>
            </div>

            {error ? <p style={{ color: "#b00020", marginTop: "10px" }}>{error}</p> : null}
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
