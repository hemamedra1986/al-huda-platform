"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_PLATFORM_SETTINGS,
  PlatformSettingsRecord,
  subscribeToPlatformSettings,
} from "@/app/lib/services/firestoreService";

interface PlatformSettingsProviderProps {
  children: ReactNode;
}

export default function PlatformSettingsProvider({ children }: PlatformSettingsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState<PlatformSettingsRecord>(DEFAULT_PLATFORM_SETTINGS);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToPlatformSettings((rows) => {
        setSettings(rows);
      });
    } catch {
      setSettings(DEFAULT_PLATFORM_SETTINGS);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty("--app-primary", settings.appearance.primaryColor);
    root.style.setProperty("--app-secondary", settings.appearance.secondaryColor);
    root.style.setProperty("--app-text", settings.appearance.textColor);
    root.style.setProperty("--app-bg", settings.appearance.backgroundColor);
    root.style.setProperty("--app-font", settings.appearance.fontFamily);

    if (settings.appearance.backgroundImageUrl) {
      body.style.backgroundImage = `url(${settings.appearance.backgroundImageUrl})`;
      body.style.backgroundSize = "cover";
      body.style.backgroundAttachment = "fixed";
    } else {
      body.style.backgroundImage = "none";
      body.style.backgroundSize = "";
      body.style.backgroundAttachment = "";
    }

    if (settings.localization.defaultLanguage) {
      root.lang = settings.localization.defaultLanguage;
    }
  }, [settings]);

  const normalizedDisabledPaths = useMemo(
    () => settings.pageControl.disabledPaths.map((path) => path.trim()).filter(Boolean),
    [settings.pageControl.disabledPaths],
  );

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname === "/login") return;

    const isDisabled = normalizedDisabledPaths.includes(pathname);
    if (isDisabled) {
      router.replace("/");
    }
  }, [pathname, normalizedDisabledPaths, router]);

  return <>{children}</>;
}
