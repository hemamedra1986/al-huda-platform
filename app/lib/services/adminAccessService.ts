"use client";

const ADMIN_SESSION_KEY = "alhuda_admin_session";
const ADMIN_SESSION_EXPIRY_KEY = "alhuda_admin_session_expiry";
const ADMIN_FAILED_ATTEMPTS_KEY = "alhuda_admin_failed_attempts";
const ADMIN_LOCKOUT_UNTIL_KEY = "alhuda_admin_lockout_until";

/** Session duration: 8 hours in milliseconds */
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

/** Lockout duration after too many failed attempts: 15 minutes */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/** Maximum failed login attempts before lockout */
const MAX_FAILED_ATTEMPTS = 5;

/** Maximum allowed password length */
export const MAX_PASSWORD_LENGTH = 128;

/** No hardcoded default password – must be configured via Firestore or environment variable */
export const DEFAULT_ADMIN_PASSWORD = "";

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!token) return false;

  const expiryStr = localStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);
  if (!expiryStr) {
    // Legacy session without expiry – treat as expired
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  }

  const expiry = parseInt(expiryStr, 10);
  if (Date.now() > expiry) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
    return false;
  }

  return true;
}

export function startAdminSession(): void {
  if (typeof window === "undefined") return;
  const token = crypto.randomUUID
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
  localStorage.setItem(ADMIN_SESSION_KEY, token);
  localStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
  // Clear failed attempts on successful login
  localStorage.removeItem(ADMIN_FAILED_ATTEMPTS_KEY);
  localStorage.removeItem(ADMIN_LOCKOUT_UNTIL_KEY);
}

export function endAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
}

export function recordFailedAttempt(): { locked: boolean; remainingAttempts: number } {
  if (typeof window === "undefined") return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };

  const attempts = parseInt(localStorage.getItem(ADMIN_FAILED_ATTEMPTS_KEY) || "0", 10) + 1;
  localStorage.setItem(ADMIN_FAILED_ATTEMPTS_KEY, String(attempts));

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(ADMIN_LOCKOUT_UNTIL_KEY, String(lockUntil));
    localStorage.removeItem(ADMIN_FAILED_ATTEMPTS_KEY);
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - attempts };
}

export function getLoginLockoutStatus(): { locked: boolean; secondsRemaining: number } {
  if (typeof window === "undefined") return { locked: false, secondsRemaining: 0 };

  const lockUntilStr = localStorage.getItem(ADMIN_LOCKOUT_UNTIL_KEY);
  if (!lockUntilStr) return { locked: false, secondsRemaining: 0 };

  const lockUntil = parseInt(lockUntilStr, 10);
  const msRemaining = lockUntil - Date.now();
  if (msRemaining <= 0) {
    localStorage.removeItem(ADMIN_LOCKOUT_UNTIL_KEY);
    return { locked: false, secondsRemaining: 0 };
  }

  return { locked: true, secondsRemaining: Math.ceil(msRemaining / 1000) };
}
