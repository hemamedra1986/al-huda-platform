"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import AdminAccessGuard from "@/app/components/AdminAccessGuard";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

type RecordMap = Record<string, unknown>;

function formatValue(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as { seconds?: number; nanoseconds?: number };
    if (typeof maybeTimestamp.seconds === "number") {
      return new Date(maybeTimestamp.seconds * 1000).toLocaleString("ar-SA");
    }

    return JSON.stringify(value);
  }

  return String(value);
}

export default function AdminFirestorePage() {
  const [authorized] = useState(true);
  const [checking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<RecordMap[]>([]);
  const [messages, setMessages] = useState<RecordMap[]>([]);
  const [orders, setOrders] = useState<RecordMap[]>([]);
  const [bookings, setBookings] = useState<RecordMap[]>([]);

  const loadCollection = async (collectionName: string, orderField: string) => {
    if (!db) {
      throw new Error("Firestore is not configured");
    }

    const ref = collection(db, collectionName);
    const q = query(ref, orderBy(orderField, "desc"), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersData, messagesData, ordersData, bookingsData] = await Promise.all([
        loadCollection("users", "updatedAt"),
        loadCollection("messages", "createdAt"),
        loadCollection("orders", "createdAt"),
        loadCollection("bookings", "createdAt"),
      ]);

      setUsers(usersData);
      setMessages(messagesData);
      setOrders(ordersData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Firestore records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderSection = (title: string, rows: RecordMap[]) => (
    <section
      style={{
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#1a3a52" }}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ color: "#777" }}>لا توجد بيانات بعد</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {rows.map((row, index) => {
            const entries = Object.entries(row).slice(0, 8);
            return (
              <div
                key={`${title}-${index}`}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#fafafa",
                }}
              >
                {entries.map(([key, value]) => (
                  <div key={key} style={{ fontSize: "13px", marginBottom: "4px" }}>
                    <strong>{key}: </strong>
                    <span>{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <ProtectedRoute allowGuest>
      <AdminAccessGuard>
        <Navigation />
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "#f5f5f5",
            direction: "rtl",
            padding: "24px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 style={{ margin: 0, color: "#1a3a52" }}>لوحة مراقبة Firestore</h1>
                <p style={{ margin: "6px 0 0", color: "#666" }}>آخر 20 سجل لكل مجموعة</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={loadData}
                  style={{
                    border: "none",
                    backgroundColor: "#1a3a52",
                    color: "white",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  تحديث
                </button>
                <Link href="/admin" style={{ color: "#1a3a52", alignSelf: "center" }}>
                  الرجوع للوحة الإدارة
                </Link>
              </div>
            </div>

            {checking ? <p>⏳ جاري التحقق من صلاحية الأدمن...</p> : null}
            {!checking && !authorized ? (
              <div style={{ backgroundColor: "#fff3f3", color: "#b00020", padding: "14px", borderRadius: "8px" }}>
                غير مصرح لك بالوصول لهذه الصفحة.
              </div>
            ) : null}
            {error ? (
              <div style={{ backgroundColor: "#fff3f3", color: "#b00020", padding: "14px", borderRadius: "8px" }}>
                {error}
              </div>
            ) : null}
            {authorized && loading ? <p>⏳ جاري تحميل السجلات...</p> : null}

            {authorized && !loading && !error ? (
              <>
                {renderSection("Users", users)}
                {renderSection("Messages", messages)}
                {renderSection("Orders", orders)}
                {renderSection("Bookings", bookings)}
              </>
            ) : null}
          </div>
        </main>
      </AdminAccessGuard>
    </ProtectedRoute>
  );
}
