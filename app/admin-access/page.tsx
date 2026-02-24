"use client";

import { FormEvent, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_ADMIN_PASSWORD,
  startAdminSession,
} from "@/app/lib/services/adminAccessService";
import { getPlatformSettings } from "@/app/lib/services/firestoreService";

function AdminAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => searchParams.get("next") || "/admin", [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let activePassword = DEFAULT_ADMIN_PASSWORD;

      try {
        const settings = await getPlatformSettings();
        activePassword = settings.adminAccess?.password || DEFAULT_ADMIN_PASSWORD;
      } catch {
        activePassword = DEFAULT_ADMIN_PASSWORD;
      }

      if (password !== activePassword) {
        setError("كلمة مرور الأدمن غير صحيحة");
        return;
      }

      startAdminSession();
      router.replace(nextPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#f5f5f5",
        direction: "rtl",
        padding: "20px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        <h1 style={{ marginTop: 0, color: "#1a3a52" }}>دخول الأدمن</h1>
        <p style={{ color: "#666" }}>اكتب كلمة مرور الأدمن للمتابعة</p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة مرور الأدمن"
            required
            style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "8px" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#1a3a52",
              color: "white",
              padding: "12px",
              fontWeight: "bold",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "جاري التحقق..." : "دخول لوحة الأدمن"}
          </button>
        </form>

        {error ? <p style={{ color: "#b00020", marginTop: "10px" }}>{error}</p> : null}
      </section>
    </main>
  );
}

export default function AdminAccessPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", direction: "rtl" }}>
          <p>⏳ جاري التحميل...</p>
        </main>
      }
    >
      <AdminAccessContent />
    </Suspense>
  );
}
