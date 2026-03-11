"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_ADMIN_PASSWORD,
  LOCKOUT_DURATION_MS,
  MAX_PASSWORD_LENGTH,
  getLoginLockoutStatus,
  recordFailedAttempt,
  startAdminSession,
} from "@/app/lib/services/adminAccessService";
import { getPlatformSettings } from "@/app/lib/services/firestoreService";

function AdminAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const nextPath = useMemo(() => searchParams.get("next") || "/admin", [searchParams]);

  // Poll lockout timer every second when locked out
  useEffect(() => {
    const status = getLoginLockoutStatus();
    setLockoutSeconds(status.secondsRemaining);

    if (!status.locked) return;

    const interval = setInterval(() => {
      const current = getLoginLockoutStatus();
      setLockoutSeconds(current.secondsRemaining);
      if (!current.locked) {
        clearInterval(interval);
        setError("");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const lockStatus = getLoginLockoutStatus();
    if (lockStatus.locked) return;

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

      if (!activePassword) {
        setError("لم يتم إعداد كلمة مرور الأدمن بعد. يرجى التواصل مع مسؤول النظام.");
        return;
      }

      if (password !== activePassword) {
        const result = recordFailedAttempt();
        if (result.locked) {
          setLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          setError("تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار 15 دقيقة.");
        } else {
          setError(`كلمة مرور الأدمن غير صحيحة. المحاولات المتبقية: ${result.remainingAttempts}`);
        }
        return;
      }

      startAdminSession();
      router.replace(nextPath);
    } finally {
      setLoading(false);
    }
  }, [password, nextPath, router]);

  const isLocked = lockoutSeconds > 0;
  const lockoutMinutes = Math.ceil(lockoutSeconds / 60);

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

        {isLocked ? (
          <div style={{ backgroundColor: "#fff3f3", color: "#b00020", padding: "14px", borderRadius: "8px", marginBottom: "12px" }}>
            الحساب مقفل مؤقتاً. يرجى الانتظار {lockoutMinutes} {lockoutMinutes === 1 ? "دقيقة" : "دقائق"}.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة مرور الأدمن"
            required
            disabled={isLocked || loading}
            maxLength={MAX_PASSWORD_LENGTH}
            autoComplete="current-password"
            style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "8px", opacity: isLocked ? 0.6 : 1 }}
          />

          <button
            type="submit"
            disabled={loading || isLocked}
            style={{
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#1a3a52",
              color: "white",
              padding: "12px",
              fontWeight: "bold",
              cursor: loading || isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.6 : 1,
            }}
          >
            {loading ? "جاري التحقق..." : "دخول لوحة الأدمن"}
          </button>
        </form>

        {error && !isLocked ? <p style={{ color: "#b00020", marginTop: "10px" }}>{error}</p> : null}
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
