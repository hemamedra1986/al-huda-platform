"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import AdminAccessGuard from "@/app/components/AdminAccessGuard";
import {
  ChatMessageRecord,
  markUserMessagesAsReplied,
  PaidConsultationOrderRecord,
  saveMessage,
  subscribeToAllMessagesForAdmin,
  subscribeToPaidConsultationOrders,
  uploadVoiceMessageAndSave,
} from "@/app/lib/services/firestoreService";

export default function AdminMessagesPage() {
  const [authorized] = useState(true);
  const [adminId] = useState("local-admin");
  const [allMessages, setAllMessages] = useState<ChatMessageRecord[]>([]);
  const [paidConsultationOrders, setPaidConsultationOrders] = useState<PaidConsultationOrderRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [error, setError] = useState("");
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [showUnrepliedOnly, setShowUnrepliedOnly] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!authorized) return;
    const unsubscribeMessages = subscribeToAllMessagesForAdmin((rows) => {
      setAllMessages(rows);
    });

    return () => unsubscribeMessages();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;

    const unsubscribePaidOrders = subscribeToPaidConsultationOrders((orders) => {
      setPaidConsultationOrders(orders);
    });

    return () => unsubscribePaidOrders();
  }, [authorized]);

  const paidUserIdsSet = useMemo(() => {
    return new Set(paidConsultationOrders.map((order) => order.userId));
  }, [paidConsultationOrders]);

  const newCountsByUserId = useMemo(() => {
    const counts: Record<string, number> = {};
    allMessages.forEach((message) => {
      if (message.senderRole === "user" && message.status === "new") {
        counts[message.userId] = (counts[message.userId] || 0) + 1;
      }
    });
    return counts;
  }, [allMessages]);

  const userIds = useMemo(() => {
    const unique = Array.from(new Set(allMessages.map((message) => message.userId)));
    return unique
      .filter(Boolean)
      .filter((uid) => (showPaidOnly ? paidUserIdsSet.has(uid) : true))
      .sort((a, b) => {
        const aPaid = paidUserIdsSet.has(a) ? 1 : 0;
        const bPaid = paidUserIdsSet.has(b) ? 1 : 0;
        const aNewCount = newCountsByUserId[a] || 0;
        const bNewCount = newCountsByUserId[b] || 0;
        const aUnreplied = aNewCount > 0 ? 1 : 0;
        const bUnreplied = bNewCount > 0 ? 1 : 0;

        const aPriority = (aPaid * 2) + aUnreplied;
        const bPriority = (bPaid * 2) + bUnreplied;

        if (aPriority !== bPriority) return bPriority - aPriority;
        if (aNewCount !== bNewCount) return bNewCount - aNewCount;

        return a.localeCompare(b);
      });
  }, [allMessages, paidUserIdsSet, showPaidOnly, newCountsByUserId]);

  const filteredUserIds = useMemo(() => {
    if (!showUnrepliedOnly) return userIds;
    return userIds.filter((uid) => (newCountsByUserId[uid] || 0) > 0);
  }, [userIds, showUnrepliedOnly, newCountsByUserId]);

  useEffect(() => {
    if (!selectedUserId && filteredUserIds.length > 0) {
      setSelectedUserId(filteredUserIds[0]);
      return;
    }

    if (selectedUserId && !filteredUserIds.includes(selectedUserId)) {
      setSelectedUserId(filteredUserIds[0] || "");
    }
  }, [filteredUserIds, selectedUserId]);

  const conversation = useMemo(
    () => allMessages.filter((message) => message.userId === selectedUserId),
    [allMessages, selectedUserId],
  );

  const handleReply = async () => {
    setError("");
    if (!replyText.trim() || !selectedUserId || !adminId) return;

    setSending(true);
    try {
      await saveMessage({
        userId: selectedUserId,
        senderId: adminId,
        roomId: `user-${selectedUserId}`,
        senderRole: "admin",
        text: replyText.trim(),
        language: "ar",
      });
      await markUserMessagesAsReplied(selectedUserId);
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إرسال الرد");
    } finally {
      setSending(false);
    }
  };

  const startAdminVoiceRecording = async () => {
    setError("");
    if (!selectedUserId || !adminId) {
      setError("اختر محادثة أولاً قبل إرسال رسالة صوتية.");
      return;
    }

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
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        if (!blob.size) {
          setIsRecordingVoice(false);
          return;
        }

        setSendingVoice(true);
        try {
          await uploadVoiceMessageAndSave({
            userId: selectedUserId,
            senderId: adminId,
            roomId: `user-${selectedUserId}`,
            senderRole: "admin",
            language: "ar",
            blob,
          });
          await markUserMessagesAsReplied(selectedUserId);
        } catch (err) {
          setError(err instanceof Error ? err.message : "فشل إرسال الرسالة الصوتية");
        } finally {
          setSendingVoice(false);
          setIsRecordingVoice(false);
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
    } catch {
      setError("تعذر الوصول إلى الميكروفون");
      setIsRecordingVoice(false);
    }
  };

  const stopAdminVoiceRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <ProtectedRoute allowGuest>
      <AdminAccessGuard>
        <Navigation />
        <main style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", direction: "rtl", padding: "24px" }}>
          <section style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h1 style={{ color: "#1a3a52", margin: 0 }}>رسائل المستخدمين</h1>
              <Link href="/admin" style={{ color: "#1a3a52" }}>الرجوع للإدارة</Link>
            </div>

            {!authorized ? (
              <div style={{ backgroundColor: "#fff3f3", color: "#b00020", padding: "12px", borderRadius: "8px" }}>
                غير مصرح لك بدخول صفحة الرسائل الإدارية.
              </div>
            ) : (
              <>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowPaidOnly((prev) => !prev)}
                  style={{
                    border: showPaidOnly ? "2px solid #2e7d32" : "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: showPaidOnly ? "#e8f5e9" : "white",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {showPaidOnly ? "✅ المدفوع فقط" : "المدفوع فقط"}
                </button>
                <button
                  onClick={() => setShowUnrepliedOnly((prev) => !prev)}
                  style={{
                    border: showUnrepliedOnly ? "2px solid #d32f2f" : "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: showUnrepliedOnly ? "#ffebee" : "white",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {showUnrepliedOnly ? "✅ غير المردود عليه" : "غير المردود عليه"}
                </button>
                <span style={{ alignSelf: "center", color: "#555", fontSize: "14px" }}>
                  جلسات مدفوعة: {paidConsultationOrders.length}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "280px 1fr",
                  gap: "12px",
                  alignItems: "start",
                }}
              >
                <aside style={{ backgroundColor: "white", borderRadius: "8px", padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <h3 style={{ marginTop: 0, color: "#1a3a52" }}>المستخدمون</h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {filteredUserIds.length === 0 ? <p style={{ color: "#777" }}>لا توجد رسائل مطابقة للفلاتر.</p> : null}
                    {filteredUserIds.map((uid) => (
                      <button
                        key={uid}
                        onClick={() => setSelectedUserId(uid)}
                        style={{
                          border: selectedUserId === uid ? "2px solid #1a3a52" : "1px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: selectedUserId === uid ? "#eef4ff" : "white",
                          padding: "8px",
                          textAlign: "right",
                          cursor: "pointer",
                          wordBreak: "break-all",
                        }}
                      >
                        <span>{uid}</span>
                        {paidUserIdsSet.has(uid) ? (
                          <span
                            style={{
                              display: "inline-block",
                              marginInlineStart: "8px",
                              backgroundColor: "#2e7d32",
                              color: "white",
                              borderRadius: "10px",
                              padding: "0 8px",
                              fontSize: "12px",
                              lineHeight: "20px",
                            }}
                          >
                            مدفوع
                          </span>
                        ) : null}
                        {(newCountsByUserId[uid] || 0) > 0 ? (
                          <span
                            style={{
                              display: "inline-block",
                              marginInlineStart: "8px",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              borderRadius: "10px",
                              padding: "0 8px",
                              fontSize: "12px",
                              lineHeight: "20px",
                            }}
                          >
                            {newCountsByUserId[uid]}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </aside>

                <section style={{ backgroundColor: "white", borderRadius: "8px", padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <h3 style={{ marginTop: 0, color: "#1a3a52" }}>المحادثة</h3>
                  <div style={{ minHeight: "340px", maxHeight: "460px", overflowY: "auto", backgroundColor: "#fafafa", borderRadius: "8px", padding: "10px", display: "grid", gap: "8px", marginBottom: "12px" }}>
                    {conversation.length === 0 ? (
                      <p style={{ color: "#777" }}>اختر مستخدمًا لعرض الرسائل.</p>
                    ) : (
                      conversation.map((message) => (
                        <div
                          key={message.id}
                          style={{
                            justifySelf: message.senderRole === "admin" ? "end" : "start",
                            backgroundColor: message.senderRole === "admin" ? "#e8f5e9" : "#e8f0ff",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            maxWidth: "75%",
                          }}
                        >
                          <div style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                            {message.senderRole === "admin" ? "الأدمن" : "المستخدم"}
                          </div>
                          {message.messageType === "audio" && message.audioUrl ? (
                            <audio controls src={message.audioUrl} style={{ maxWidth: "100%" }} />
                          ) : (
                            <div>{message.text}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="اكتب رد الأدمن..."
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || sendingVoice || !replyText.trim() || !selectedUserId}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        padding: "0 16px",
                        backgroundColor: "#1a3a52",
                        color: "white",
                        fontWeight: "bold",
                        cursor: sending ? "wait" : "pointer",
                      }}
                    >
                      {sending ? "جاري..." : "إرسال الرد"}
                    </button>
                    <button
                      onClick={isRecordingVoice ? stopAdminVoiceRecording : startAdminVoiceRecording}
                      disabled={!selectedUserId || sending || sendingVoice}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        padding: "0 14px",
                        backgroundColor: isRecordingVoice ? "#d32f2f" : "#2e7d32",
                        color: "white",
                        fontWeight: "bold",
                        cursor: sendingVoice ? "wait" : "pointer",
                      }}
                    >
                      {sendingVoice ? "رفع..." : isRecordingVoice ? "إيقاف" : "🎙️ صوت"}
                    </button>
                  </div>
                  {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
                </section>
              </div>
              </>
            )}
          </section>
        </main>
      </AdminAccessGuard>
    </ProtectedRoute>
  );
}
