"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { signOutUser, subscribeToAuth } from "@/app/lib/services/authService";
import { DEFAULT_PLATFORM_SETTINGS, subscribeToPlatformSettings } from "@/app/lib/services/firestoreService";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [disabledPaths, setDisabledPaths] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PLATFORM_SETTINGS.appearance.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_PLATFORM_SETTINGS.appearance.secondaryColor);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToAuth((authUser) => {
        setUser(authUser);
      });
    } catch {
      setUser(null);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToPlatformSettings((settings) => {
        setDisabledPaths(settings.pageControl.disabledPaths || []);
        setPrimaryColor(settings.appearance.primaryColor || DEFAULT_PLATFORM_SETTINGS.appearance.primaryColor);
        setSecondaryColor(settings.appearance.secondaryColor || DEFAULT_PLATFORM_SETTINGS.appearance.secondaryColor);
      });
    } catch {
      setDisabledPaths([]);
      setPrimaryColor(DEFAULT_PLATFORM_SETTINGS.appearance.primaryColor);
      setSecondaryColor(DEFAULT_PLATFORM_SETTINGS.appearance.secondaryColor);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const navItems = [
    { name: "🎓 علوم شرعية", href: "/courses" },
    { name: "📞 استشارات", href: "/consultations" },
    { name: "📨 رسائل", href: "/messages" },
    { name: "� المصحف", href: "/quran" },
    { name: "🎤 تدريب القراءة", href: "/quran-tutor" },
    { name: "📅 احجز الشيخ", href: "/quran-booking" },
    { name: "💬 شات فوري", href: "/chat" },
    { name: "🌐 غرف صوتية", href: "/voice" },
    { name: "💝 تبرعات", href: "/donations" },
    { name: "📚 المكتبة", href: "/library" },
    { name: "💬 المنتدى", href: "/forum" },
  ];

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !disabledPaths.includes(item.href)),
    [navItems, disabledPaths],
  );

  return (
    <nav style={{
      backgroundColor: primaryColor,
      color: "white",
      padding: "15px 30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      direction: "rtl",
    }}>
      <Link href="/" style={{ fontSize: "24px", fontWeight: "bold", textDecoration: "none", color: "white" }}>
        📚 منصة الهُدى
      </Link>

      <div style={{
        display: "flex",
        gap: "30px",
        alignItems: "center",
      }}>
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: "none",
              color: "white",
              fontSize: "16px",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffd700")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: "15px" }}>
        {user ? (
          <>
            <Link
              href="/profile"
              style={{
                backgroundColor: secondaryColor,
                color: primaryColor,
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              حسابي
            </Link>
            <button
              onClick={() => signOutUser()}
              style={{
                backgroundColor: "#d32f2f",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              خروج
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
