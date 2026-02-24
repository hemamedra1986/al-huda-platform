"use client";

const ADMIN_SESSION_KEY = "alhuda_admin_session";

export const DEFAULT_ADMIN_PASSWORD = "admin123";

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function startAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SESSION_KEY, "1");
}

export function endAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
