"use client";

const GUEST_ID_KEY = "alhuda_guest_user_id";
const GUEST_EMAIL_KEY = "alhuda_guest_email";

function generateGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getOrCreateGuestSession() {
  if (typeof window === "undefined") {
    return {
      userId: "",
      email: "",
    };
  }

  let userId = localStorage.getItem(GUEST_ID_KEY) || "";
  if (!userId) {
    userId = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, userId);
  }

  let email = localStorage.getItem(GUEST_EMAIL_KEY) || "";
  if (!email) {
    email = `${userId}@guest.alhuda.local`;
    localStorage.setItem(GUEST_EMAIL_KEY, email);
  }

  return { userId, email };
}
