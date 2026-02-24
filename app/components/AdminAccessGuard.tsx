"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasAdminSession } from "@/app/lib/services/adminAccessService";

interface AdminAccessGuardProps {
  children: ReactNode;
}

export default function AdminAccessGuard({ children }: AdminAccessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const valid = hasAdminSession();
    setAllowed(valid);
    setChecking(false);

    if (!valid) {
      router.replace(`/admin-access?next=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [pathname, router]);

  if (checking) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", direction: "rtl" }}>
        <p>⏳ جاري التحقق من صلاحية الأدمن...</p>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
