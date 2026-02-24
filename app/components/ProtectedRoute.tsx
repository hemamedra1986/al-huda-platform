"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { subscribeToAuth } from "@/app/lib/services/authService";

interface ProtectedRouteProps {
  children: ReactNode;
  allowGuest?: boolean;
}

export default function ProtectedRoute({ children, allowGuest = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (allowGuest) {
      setCheckingAuth(false);
      return;
    }
  }, [allowGuest]);

  useEffect(() => {
    if (allowGuest) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToAuth((authUser) => {
        setUser(authUser);
        setCheckingAuth(false);

        if (!authUser) {
          router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
        }
      });
    } catch {
      setCheckingAuth(false);
      router.replace("/login");
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, pathname, allowGuest]);

  if (checkingAuth) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", direction: "rtl" }}>
        <p>⏳ جاري التحقق من تسجيل الدخول...</p>
      </main>
    );
  }

  if (!allowGuest && !user) {
    return null;
  }

  return <>{children}</>;
}
