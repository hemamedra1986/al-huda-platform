"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", direction: "rtl" }}>
      <p>تم تعطيل تسجيل دخول الزوار. جاري التحويل...</p>
    </main>
  );
}
