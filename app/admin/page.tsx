"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import AdminAccessGuard from "@/app/components/AdminAccessGuard";
import { endAdminSession } from "@/app/lib/services/adminAccessService";
import {
  DEFAULT_PLATFORM_SETTINGS,
  AdminOrderRecord,
  AdminUserRecord,
  ChatMessageRecord,
  PlatformMediaItem,
  PlatformSettingsRecord,
  VoiceCallRecord,
  markUserMessagesAsReplied,
  grantPaidConsultationAccessByAdmin,
  saveMessage,
  savePlatformSettings,
  subscribeToAllMessagesForAdmin,
  subscribeToOrdersForAdmin,
  subscribeToPlatformSettings,
  subscribeToUsersForAdmin,
  subscribeToVoiceCallsForAdmin,
  updateOrderStatus,
  updateVoiceCallStatus,
} from "@/app/lib/services/firestoreService";

type Tab = "users" | "messages" | "payments" | "platform" | "voicecalls";

export default function AdminPanelPage() {
  const [authorized] = useState(true);
  const [adminId] = useState("local-admin");
  const [tab, setTab] = useState<Tab>("users");

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [voiceCalls, setVoiceCalls] = useState<VoiceCallRecord[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsRecord>(DEFAULT_PLATFORM_SETTINGS);
  const [savingPlatform, setSavingPlatform] = useState(false);

  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookUrl, setNewBookUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantStatus, setGrantStatus] = useState("");

  useEffect(() => {
    if (!authorized) return;
    const unsubscribeUsers = subscribeToUsersForAdmin((rows) => setUsers(rows));
    return () => unsubscribeUsers();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    const unsubscribeMessages = subscribeToAllMessagesForAdmin((rows) => setMessages(rows));
    return () => unsubscribeMessages();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    const unsubscribeOrders = subscribeToOrdersForAdmin((rows) => setOrders(rows));
    return () => unsubscribeOrders();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    const unsubscribeSettings = subscribeToPlatformSettings((rows) => {
      setPlatformSettings(rows);
    });

    return () => unsubscribeSettings();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    try {
      const unsubscribeVoiceCalls = subscribeToVoiceCallsForAdmin((calls) => setVoiceCalls(calls));
      return () => unsubscribeVoiceCalls();
    } catch {
      // Firebase may not be configured; ignore
    }
  }, [authorized]);

  const filteredMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) => {
      const text = (message.text || "").toLowerCase();
      const userId = (message.userId || "").toLowerCase();
      const status = (message.status || "").toLowerCase();
      const senderRole = (message.senderRole || "").toLowerCase();
      const messageType = (message.messageType || "").toLowerCase();
      return (
        text.includes(query) ||
        userId.includes(query) ||
        status.includes(query) ||
        senderRole.includes(query) ||
        messageType.includes(query)
      );
    });
  }, [messages, messageSearch]);

  const userIdsWithMessages = useMemo(() => {
    return Array.from(new Set(filteredMessages.map((message) => message.userId))).filter(Boolean);
  }, [filteredMessages]);

  useEffect(() => {
    if (selectedUserId && !userIdsWithMessages.includes(selectedUserId)) {
      setSelectedUserId(userIdsWithMessages[0] || "");
      return;
    }

    if (!selectedUserId && userIdsWithMessages.length > 0) {
      setSelectedUserId(userIdsWithMessages[0]);
    }
  }, [userIdsWithMessages, selectedUserId]);

  const selectedConversation = useMemo(
    () => filteredMessages.filter((message) => message.userId === selectedUserId),
    [filteredMessages, selectedUserId],
  );

  const newMessagesCount = useMemo(
    () => messages.filter((message) => message.senderRole === "user" && message.status === "new").length,
    [messages],
  );

  const pendingPaymentsCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders],
  );

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const email = (user.email || "").toLowerCase();
      const displayName = (user.displayName || "").toLowerCase();
      const uid = (user.uid || user.id || "").toLowerCase();
      return email.includes(query) || displayName.includes(query) || uid.includes(query);
    });
  }, [users, userSearch]);

  const filteredOrders = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => {
      const userId = (order.userId || "").toLowerCase();
      const email = (order.email || "").toLowerCase();
      const planName = (order.planName || "").toLowerCase();
      const planId = (order.planId || "").toLowerCase();
      const status = (order.status || "").toLowerCase();
      return (
        userId.includes(query) ||
        email.includes(query) ||
        planName.includes(query) ||
        planId.includes(query) ||
        status.includes(query)
      );
    });
  }, [orders, paymentSearch]);

  const handleReply = async () => {
    setError("");

    if (!selectedUserId || !adminId || !replyText.trim()) {
      return;
    }

    setReplying(true);
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
      setError(err instanceof Error ? err.message : "تعذر إرسال الرد");
    } finally {
      setReplying(false);
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    status: "pending" | "paid" | "failed",
  ) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث حالة الدفع");
    }
  };

  const updatePlatformSettings = (updater: (prev: PlatformSettingsRecord) => PlatformSettingsRecord) => {
    setPlatformSettings((prev) => updater(prev));
  };

  const addLibraryItem = (type: "books" | "videos", title: string, url: string) => {
    const cleanTitle = title.trim();
    const cleanUrl = url.trim();
    if (!cleanTitle || !cleanUrl) return;

    const item: PlatformMediaItem = {
      id: `${type}-${Date.now()}`,
      title: cleanTitle,
      url: cleanUrl,
    };

    updatePlatformSettings((prev) => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: [item, ...prev.library[type]],
      },
    }));
  };

  const removeLibraryItem = (type: "books" | "videos", itemId: string) => {
    updatePlatformSettings((prev) => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: prev.library[type].filter((item) => item.id !== itemId),
      },
    }));
  };

  const handleSavePlatformSettings = async () => {
    setSavingPlatform(true);
    setError("");
    try {
      const payload =
        newAdminPassword.trim().length > 0
          ? {
              ...platformSettings,
              adminAccess: {
                ...platformSettings.adminAccess,
                password: newAdminPassword.trim(),
              },
            }
          : platformSettings;

      await savePlatformSettings(payload, adminId || "local-admin");
      if (newAdminPassword.trim()) {
        setNewAdminPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ إعدادات المنصة");
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleGrantPaidAccess = async () => {
    const targetUserId = grantUserId.trim();
    if (!targetUserId) {
      setGrantStatus("اكتب User ID أولاً.");
      return;
    }

    setGrantStatus("⏳ جاري تفعيل الصلاحية...");
    try {
      await grantPaidConsultationAccessByAdmin(targetUserId, adminId || "local-admin");
      setGrantStatus("✅ تم تفعيل صلاحية المستخدم المدفوع بنجاح.");
      setGrantUserId("");
    } catch (err) {
      setGrantStatus(err instanceof Error ? err.message : "تعذر تفعيل الصلاحية");
    }
  };

  const renderUsersTab = () => (
    <section style={{ backgroundColor: "white", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h2 style={{ marginTop: 0, color: "#1a3a52" }}>كل المستخدمين ({filteredUsers.length})</h2>
      <div style={{ display: "grid", gap: "8px", marginBottom: "14px", padding: "10px", borderRadius: "8px", backgroundColor: "#fafafa", border: "1px solid #eee" }}>
        <strong style={{ color: "#1a3a52" }}>تفعيل مستخدم مدفوع بواسطة الأدمن</strong>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={grantUserId}
            onChange={(event) => setGrantUserId(event.target.value)}
            placeholder="اكتب userId الخاص بالمستخدم"
            style={{ flex: 1, minWidth: "240px", padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
          <button
            onClick={handleGrantPaidAccess}
            style={{ border: "none", borderRadius: "8px", padding: "9px 14px", backgroundColor: "#1a3a52", color: "white", fontWeight: "bold", cursor: "pointer" }}
          >
            تفعيل المستخدم
          </button>
        </div>
        {grantStatus ? <p style={{ margin: 0, color: grantStatus.startsWith("✅") ? "#1b5e20" : "#8a4b00" }}>{grantStatus}</p> : null}
      </div>

      <input
        type="text"
        value={userSearch}
        onChange={(event) => setUserSearch(event.target.value)}
        placeholder="بحث بالمستخدم (الاسم / الإيميل / UID)"
        style={{ width: "100%", marginBottom: "12px", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
      />
      {filteredUsers.length === 0 ? (
        <p style={{ color: "#777" }}>لا يوجد مستخدمون بعد.</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {filteredUsers.map((user) => (
            <div key={user.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "10px", backgroundColor: "#fafafa" }}>
              <div><strong>الاسم:</strong> {user.displayName || "-"}</div>
              <div><strong>الإيميل:</strong> {user.email || "-"}</div>
              <div><strong>UID:</strong> {user.uid || user.id}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderMessagesTab = () => (
    <section style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "12px" }}>
      <aside style={{ backgroundColor: "white", borderRadius: "10px", padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h3 style={{ marginTop: 0, color: "#1a3a52" }}>المحادثات</h3>
        <p style={{ color: "#777", fontSize: "13px" }}>رسائل جديدة: {newMessagesCount}</p>
        <input
          type="text"
          value={messageSearch}
          onChange={(event) => setMessageSearch(event.target.value)}
          placeholder="بحث (userId / النص / status / type)"
          style={{ width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}
        />
        <div style={{ display: "grid", gap: "8px" }}>
          {userIdsWithMessages.length === 0 ? (
            <p style={{ color: "#777", margin: 0 }}>لا توجد نتائج مطابقة.</p>
          ) : null}
          {userIdsWithMessages.map((uid) => {
            const unread = messages.filter((m) => m.userId === uid && m.senderRole === "user" && m.status === "new").length;
            return (
              <button
                key={uid}
                onClick={() => setSelectedUserId(uid)}
                style={{
                  textAlign: "right",
                  border: selectedUserId === uid ? "2px solid #1a3a52" : "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: selectedUserId === uid ? "#eef4ff" : "white",
                  padding: "8px",
                  cursor: "pointer",
                  wordBreak: "break-all",
                }}
              >
                <span>{uid}</span>
                {unread > 0 ? (
                  <span style={{ marginInlineStart: "8px", backgroundColor: "#d32f2f", color: "white", borderRadius: "10px", padding: "0 7px", fontSize: "12px" }}>{unread}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h3 style={{ marginTop: 0, color: "#1a3a52" }}>الرسائل والرد</h3>
        <div style={{ minHeight: "280px", maxHeight: "420px", overflowY: "auto", backgroundColor: "#fafafa", borderRadius: "8px", padding: "10px", display: "grid", gap: "8px", marginBottom: "10px" }}>
          {selectedConversation.length === 0 ? (
            <p style={{ color: "#777" }}>اختر مستخدمًا لعرض الرسائل.</p>
          ) : (
            selectedConversation.map((message) => (
              <div key={message.id} style={{ justifySelf: message.senderRole === "admin" ? "end" : "start", backgroundColor: message.senderRole === "admin" ? "#e8f5e9" : "#e8f0ff", borderRadius: "8px", padding: "8px 10px", maxWidth: "75%" }}>
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
            placeholder="اكتب ردك هنا..."
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
            disabled={replying || !replyText.trim() || !selectedUserId}
            style={{ border: "none", borderRadius: "8px", padding: "0 16px", backgroundColor: "#1a3a52", color: "white", fontWeight: "bold", cursor: replying ? "wait" : "pointer" }}
          >
            {replying ? "جاري..." : "رد"}
          </button>
        </div>
      </div>
    </section>
  );

  const renderPaymentsTab = () => (
    <section style={{ backgroundColor: "white", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h2 style={{ marginTop: 0, color: "#1a3a52" }}>إدارة المدفوعات</h2>
      <p style={{ color: "#777" }}>مدفوعات قيد الانتظار: {pendingPaymentsCount}</p>

      <input
        type="text"
        value={paymentSearch}
        onChange={(event) => setPaymentSearch(event.target.value)}
        placeholder="بحث بالمدفوعات (userId / email / plan / status)"
        style={{ width: "100%", marginBottom: "12px", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
      />

      {filteredOrders.length === 0 ? (
        <p style={{ color: "#777" }}>لا توجد عمليات دفع بعد.</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {filteredOrders.map((order) => (
            <div key={order.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "10px", backgroundColor: "#fafafa" }}>
              <div><strong>الخطة:</strong> {order.planName}</div>
              <div><strong>المستخدم:</strong> {order.userId}</div>
              <div><strong>المبلغ:</strong> {order.amount} {order.currency}</div>
              <div><strong>الحالة الحالية:</strong> {order.status}</div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                <button onClick={() => handleUpdatePaymentStatus(order.id, "pending")} style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>pending</button>
                <button onClick={() => handleUpdatePaymentStatus(order.id, "paid")} style={{ border: "1px solid #2e7d32", color: "#2e7d32", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>paid</button>
                <button onClick={() => handleUpdatePaymentStatus(order.id, "failed")} style={{ border: "1px solid #d32f2f", color: "#d32f2f", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>failed</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderVoiceCallsTab = () => (
    <section style={{ backgroundColor: "white", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "grid", gap: "14px" }}>
      <h2 style={{ marginTop: 0, color: "#1a3a52" }}>📞 المكالمات الصوتية الواردة</h2>
      {voiceCalls.length === 0 ? (
        <p style={{ color: "#666" }}>لا توجد مكالمات صوتية نشطة أو في الانتظار.</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {voiceCalls.map((call) => (
            <div key={call.id} style={{ border: call.status === "waiting" ? "2px solid #e74c3c" : "1px solid #ddd", borderRadius: "8px", padding: "12px", backgroundColor: call.status === "waiting" ? "#fff5f5" : "#f9f9f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ color: "#1a3a52" }}>{call.roomName}</strong>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{call.roomDescription}</div>
                  <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>المستخدم: {call.userId}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: call.status === "waiting" ? "#e74c3c" : "#27ae60", backgroundColor: call.status === "waiting" ? "#fde8e8" : "#e8f5e9", padding: "4px 8px", borderRadius: "4px" }}>
                    {call.status === "waiting" ? "⏳ في الانتظار" : "✅ نشطة"}
                  </span>
                  <button
                    onClick={async () => {
                      try { await updateVoiceCallStatus(call.id, "ended"); } catch {}
                    }}
                    style={{ border: "1px solid #666", color: "#666", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontSize: "12px" }}
                  >
                    إنهاء
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderPlatformTab = () => (
    <section style={{ backgroundColor: "white", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "grid", gap: "14px" }}>
      <h2 style={{ marginTop: 0, color: "#1a3a52" }}>إعدادات وصلاحيات المنصة</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>اللون الأساسي</span>
          <input
            type="color"
            value={platformSettings.appearance.primaryColor}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, primaryColor: event.target.value },
            }))}
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>اللون الثانوي</span>
          <input
            type="color"
            value={platformSettings.appearance.secondaryColor}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, secondaryColor: event.target.value },
            }))}
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>لون النص</span>
          <input
            type="color"
            value={platformSettings.appearance.textColor}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, textColor: event.target.value },
            }))}
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>لون الخلفية</span>
          <input
            type="color"
            value={platformSettings.appearance.backgroundColor}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, backgroundColor: event.target.value },
            }))}
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>الخط الأساسي</span>
          <input
            type="text"
            value={platformSettings.appearance.fontFamily}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, fontFamily: event.target.value },
            }))}
            placeholder="مثال: Cairo, Arial, sans-serif"
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>رابط صورة الخلفية (اختياري)</span>
          <input
            type="text"
            value={platformSettings.appearance.backgroundImageUrl}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, backgroundImageUrl: event.target.value },
            }))}
            placeholder="https://..."
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        <h3 style={{ margin: 0, color: "#1a3a52" }}>اللغات</h3>
        <label style={{ display: "grid", gap: "6px", maxWidth: "280px" }}>
          <span>اللغة الافتراضية</span>
          <select
            value={platformSettings.localization.defaultLanguage}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              localization: { ...prev.localization, defaultLanguage: event.target.value },
            }))}
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ur">اردو</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>اللغات المسموحة (مفصولة بفاصلة)</span>
          <input
            type="text"
            value={platformSettings.localization.enabledLanguages.join(",")}
            onChange={(event) => {
              const list = event.target.value
                .split(",")
                .map((lang) => lang.trim())
                .filter(Boolean);
              updatePlatformSettings((prev) => ({
                ...prev,
                localization: { ...prev.localization, enabledLanguages: list },
              }));
            }}
            placeholder="ar,en"
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0, color: "#1a3a52" }}>تعطيل الصفحات</h3>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>مسارات الصفحات المعطلة (مفصولة بفاصلة)</span>
          <input
            type="text"
            value={platformSettings.pageControl.disabledPaths.join(",")}
            onChange={(event) => {
              const list = event.target.value
                .split(",")
                .map((path) => path.trim())
                .filter(Boolean);
              updatePlatformSettings((prev) => ({
                ...prev,
                pageControl: { ...prev.pageControl, disabledPaths: list },
              }));
            }}
            placeholder="/chat,/forum"
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0, color: "#1a3a52" }}>الرسائل (كتابي وصوتي)</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={platformSettings.messaging.allowTextMessages}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              messaging: { ...prev.messaging, allowTextMessages: event.target.checked },
            }))}
          />
          تفعيل الرسائل الكتابية
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={platformSettings.messaging.allowVoiceMessages}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              messaging: { ...prev.messaging, allowVoiceMessages: event.target.checked },
            }))}
          />
          تفعيل الرسائل الصوتية
        </label>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0, color: "#1a3a52" }}>المدفوعات والتوجيه</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={platformSettings.payments.receivePayments}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              payments: { ...prev.payments, receivePayments: event.target.checked },
            }))}
          />
          استقبال المدفوعات
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>وجهة التوجيه</span>
          <input
            type="text"
            value={platformSettings.payments.routingDestination}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              payments: { ...prev.payments, routingDestination: event.target.value },
            }))}
            placeholder="Stripe Main / PayPal Business / Bank Account"
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>ملاحظات التوجيه</span>
          <textarea
            value={platformSettings.payments.routingNotes}
            onChange={(event) => updatePlatformSettings((prev) => ({
              ...prev,
              payments: { ...prev.payments, routingNotes: event.target.value },
            }))}
            rows={3}
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd", resize: "vertical" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0, color: "#1a3a52" }}>كلمة مرور الأدمن</h3>
        <p style={{ margin: 0, color: "#666", fontSize: "13px" }}>
          اترك الحقل فارغًا إذا لا تريد تغيير كلمة المرور الحالية.
        </p>
        <label style={{ display: "grid", gap: "6px", maxWidth: "360px" }}>
          <span>كلمة مرور جديدة</span>
          <input
            type="password"
            value={newAdminPassword}
            onChange={(event) => setNewAdminPassword(event.target.value)}
            placeholder="مثال: admin123"
            style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        <h3 style={{ margin: 0, color: "#1a3a52" }}>تحميل الكتب والفيديوهات</h3>

        <div style={{ display: "grid", gap: "8px", backgroundColor: "#fafafa", borderRadius: "8px", padding: "10px" }}>
          <strong>إضافة كتاب</strong>
          <input value={newBookTitle} onChange={(event) => setNewBookTitle(event.target.value)} placeholder="عنوان الكتاب" style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }} />
          <input value={newBookUrl} onChange={(event) => setNewBookUrl(event.target.value)} placeholder="رابط الكتاب (PDF/EPUB)" style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }} />
          <button
            onClick={() => {
              addLibraryItem("books", newBookTitle, newBookUrl);
              setNewBookTitle("");
              setNewBookUrl("");
            }}
            style={{ border: "none", borderRadius: "8px", padding: "8px 12px", backgroundColor: "#1a3a52", color: "white", cursor: "pointer", width: "fit-content" }}
          >
            إضافة كتاب
          </button>
          <div style={{ display: "grid", gap: "6px" }}>
            {platformSettings.library.books.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", border: "1px solid #eee", borderRadius: "8px", padding: "8px" }}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#1a3a52", wordBreak: "break-all" }}>{item.title}</a>
                <button onClick={() => removeLibraryItem("books", item.id)} style={{ border: "1px solid #d32f2f", color: "#d32f2f", backgroundColor: "white", borderRadius: "6px", cursor: "pointer", padding: "4px 8px" }}>حذف</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "8px", backgroundColor: "#fafafa", borderRadius: "8px", padding: "10px" }}>
          <strong>إضافة فيديو</strong>
          <input value={newVideoTitle} onChange={(event) => setNewVideoTitle(event.target.value)} placeholder="عنوان الفيديو" style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }} />
          <input value={newVideoUrl} onChange={(event) => setNewVideoUrl(event.target.value)} placeholder="رابط الفيديو" style={{ padding: "9px", borderRadius: "8px", border: "1px solid #ddd" }} />
          <button
            onClick={() => {
              addLibraryItem("videos", newVideoTitle, newVideoUrl);
              setNewVideoTitle("");
              setNewVideoUrl("");
            }}
            style={{ border: "none", borderRadius: "8px", padding: "8px 12px", backgroundColor: "#1a3a52", color: "white", cursor: "pointer", width: "fit-content" }}
          >
            إضافة فيديو
          </button>
          <div style={{ display: "grid", gap: "6px" }}>
            {platformSettings.library.videos.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", border: "1px solid #eee", borderRadius: "8px", padding: "8px" }}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#1a3a52", wordBreak: "break-all" }}>{item.title}</a>
                <button onClick={() => removeLibraryItem("videos", item.id)} style={{ border: "1px solid #d32f2f", color: "#d32f2f", backgroundColor: "white", borderRadius: "6px", cursor: "pointer", padding: "4px 8px" }}>حذف</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSavePlatformSettings}
        disabled={savingPlatform}
        style={{ border: "none", borderRadius: "8px", padding: "10px 16px", backgroundColor: "#1a3a52", color: "white", fontWeight: "bold", cursor: savingPlatform ? "wait" : "pointer", width: "fit-content" }}
      >
        {savingPlatform ? "جاري الحفظ..." : "حفظ إعدادات المنصة"}
      </button>
    </section>
  );

  return (
    <ProtectedRoute allowGuest>
      <AdminAccessGuard>
        <Navigation />
        <main style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", direction: "rtl", padding: "24px" }}>
          <section style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 style={{ margin: 0, color: "#1a3a52" }}>لوحة تحكم الأدمن</h1>
              <div style={{ display: "flex", gap: "12px" }}>
                <Link href="/admin/messages" style={{ color: "#1a3a52" }}>صفحة الرسائل المفصلة</Link>
                <Link href="/admin/firestore" style={{ color: "#1a3a52" }}>Firestore</Link>
                <button
                  onClick={() => {
                    endAdminSession();
                    window.location.href = "/admin-access";
                  }}
                  style={{ border: "1px solid #d32f2f", color: "#d32f2f", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", padding: "4px 10px" }}
                >
                  خروج الأدمن
                </button>
              </div>
            </div>

            {!authorized ? (
              <div style={{ backgroundColor: "#fff3f3", color: "#b00020", padding: "12px", borderRadius: "8px" }}>
                غير مصرح لك بدخول لوحة الأدمن.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setTab("users")} style={{ border: tab === "users" ? "2px solid #1a3a52" : "1px solid #ddd", backgroundColor: tab === "users" ? "#eef4ff" : "white", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold" }}>المستخدمين</button>
                  <button onClick={() => setTab("messages")} style={{ border: tab === "messages" ? "2px solid #1a3a52" : "1px solid #ddd", backgroundColor: tab === "messages" ? "#eef4ff" : "white", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold" }}>الرسائل</button>
                  <button onClick={() => setTab("payments")} style={{ border: tab === "payments" ? "2px solid #1a3a52" : "1px solid #ddd", backgroundColor: tab === "payments" ? "#eef4ff" : "white", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold" }}>المدفوعات</button>
                  <button onClick={() => setTab("voicecalls")} style={{ border: tab === "voicecalls" ? "2px solid #1a3a52" : "1px solid #ddd", backgroundColor: tab === "voicecalls" ? "#eef4ff" : "white", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold", position: "relative" }}>
                    📞 المكالمات الصوتية
                    {voiceCalls.length > 0 ? <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#e74c3c", color: "white", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>{voiceCalls.length}</span> : null}
                  </button>
                  <button onClick={() => setTab("platform")} style={{ border: tab === "platform" ? "2px solid #1a3a52" : "1px solid #ddd", backgroundColor: tab === "platform" ? "#eef4ff" : "white", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold" }}>إعدادات المنصة</button>
                </div>

                {tab === "users" ? renderUsersTab() : null}
                {tab === "messages" ? renderMessagesTab() : null}
                {tab === "payments" ? renderPaymentsTab() : null}
                {tab === "voicecalls" ? renderVoiceCallsTab() : null}
                {tab === "platform" ? renderPlatformTab() : null}

                {error ? <p style={{ color: "#b00020", margin: 0 }}>{error}</p> : null}
              </>
            )}
          </section>
        </main>
      </AdminAccessGuard>
    </ProtectedRoute>
  );
}
