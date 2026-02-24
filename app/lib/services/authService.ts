"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { app, auth, db } from "@/app/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phone?: string;
  bio?: string;
  provider: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
}

function ensureFirebaseReady() {
  if (!app || !auth || !db) {
    throw new Error("Firebase is not configured. Please set Firebase environment variables.");
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  ensureFirebaseReady();
  return onAuthStateChanged(auth!, callback);
}

export async function signInWithGoogle() {
  ensureFirebaseReady();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth!, provider);
  await upsertUserProfile(result.user);
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  ensureFirebaseReady();
  const credential = await createUserWithEmailAndPassword(auth!, email, password);

  if (displayName.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }

  await upsertUserProfile({
    ...credential.user,
    displayName: displayName.trim() || credential.user.displayName,
  } as User);

  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  ensureFirebaseReady();
  const credential = await signInWithEmailAndPassword(auth!, email, password);
  await upsertUserProfile(credential.user);
  return credential.user;
}

export async function signOutUser() {
  ensureFirebaseReady();
  await signOut(auth!);
}

export async function upsertUserProfile(user: User) {
  ensureFirebaseReady();

  const profileRef = doc(db!, "users", user.uid);
  const existing = await getDoc(profileRef);

  await setDoc(
    profileRef,
    {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      provider: user.providerData?.[0]?.providerId || "password",
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  ensureFirebaseReady();

  const profileRef = doc(db!, "users", uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return null;
  }

  return profileSnap.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: Pick<UserProfile, "displayName" | "phone" | "bio">,
) {
  ensureFirebaseReady();

  const profileRef = doc(db!, "users", uid);
  await updateDoc(profileRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
