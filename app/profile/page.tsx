"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "firebase/auth";
import {
  UserProfile,
  getUserProfile,
  signOutUser,
  subscribeToAuth,
  updateUserProfile,
  upsertUserProfile,
} from "@/app/lib/services/authService";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      try {
        await upsertUserProfile(currentUser);
        const profileData = await getUserProfile(currentUser.uid);
        setProfile(profileData);
        setDisplayName(profileData?.displayName || currentUser.displayName || "");
        setPhone(profileData?.phone || "");
        setBio(profileData?.bio || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل تحميل البيانات");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });

      const profileData = await getUserProfile(user.uid);
      setProfile(profileData);
      setSuccess("تم حفظ بياناتك بنجاح");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", direction: "rtl" }}>
        <p>جاري تحميل الملف الشخصي...</p>
      </main>
    );
  }

  return (
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
          maxWidth: "720px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        }}
      >
        <h1 style={{ marginTop: 0, color: "#1a3a52" }}>الملف الشخصي</h1>

        <div style={{ marginBottom: "18px", color: "#333" }}>
          <p style={{ margin: "4px 0" }}><strong>البريد الإلكتروني:</strong> {profile?.email || user?.email}</p>
          <p style={{ margin: "4px 0" }}><strong>طريقة التسجيل:</strong> {profile?.provider || "غير معروف"}</p>
        </div>

        <form onSubmit={handleSave} style={{ display: "grid", gap: "12px" }}>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="الاسم"
            required
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          />

          <input
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="رقم الهاتف (اختياري)"
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          />

          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="نبذة مختصرة (اختياري)"
            rows={4}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", resize: "vertical" }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#1a3a52",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {saving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        </form>

        {error && <p style={{ color: "#b00020", marginTop: "10px" }}>{error}</p>}
        {success && <p style={{ color: "#0a7a33", marginTop: "10px" }}>{success}</p>}

        <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#b00020",
              color: "white",
              cursor: "pointer",
            }}
          >
            تسجيل الخروج
          </button>

          <Link href="/" style={{ alignSelf: "center", color: "#1a3a52" }}>
            العودة للرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
