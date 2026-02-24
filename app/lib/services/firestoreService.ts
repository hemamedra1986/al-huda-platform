"use client";

import {
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/app/lib/firebase";

function ensureFirestoreReady() {
  if (!db) {
    throw new Error("Firestore is not configured. Please set Firebase environment variables.");
  }
}

export interface AppMessageInput {
  userId: string;
  senderId?: string;
  roomId: string;
  senderRole: "user" | "specialist" | "admin";
  text: string;
  language: string;
  status?: "new" | "replied";
  messageType?: "text" | "audio";
  audioUrl?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
}

export interface ChatMessageRecord {
  id: string;
  userId: string;
  senderId?: string;
  roomId: string;
  senderRole: "user" | "specialist" | "admin";
  text: string;
  language: string;
  status?: "new" | "replied";
  messageType?: "text" | "audio";
  audioUrl?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  createdAt?: Timestamp;
}

export interface AppOrderInput {
  userId: string;
  email: string;
  type: "subscription" | "donation" | "booking";
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentIntentId?: string;
  status: "pending" | "paid" | "failed";
}

export interface AdminUserRecord {
  id: string;
  uid?: string;
  email?: string;
  displayName?: string;
  phone?: string;
  provider?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface AdminOrderRecord {
  id: string;
  userId: string;
  email: string;
  type: "subscription" | "donation" | "booking";
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentIntentId?: string;
  status: "pending" | "paid" | "failed";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PaidConsultationOrderRecord {
  id: string;
  userId: string;
  email: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  createdAt?: Timestamp;
}

export interface AppBookingInput {
  userId: string;
  studentName: string;
  studentEmail: string;
  sheikhName: string;
  surahNumber: number;
  date: string;
  time: string;
  learningLevel: string;
  notes: string;
  amount: number;
  currency: string;
  paymentStatus: "pending" | "paid" | "free";
}

export interface PlatformAppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  backgroundImageUrl: string;
}

export interface PlatformLocalizationSettings {
  defaultLanguage: string;
  enabledLanguages: string[];
}

export interface PlatformMediaItem {
  id: string;
  title: string;
  url: string;
}

export interface PlatformMessagingSettings {
  allowTextMessages: boolean;
  allowVoiceMessages: boolean;
}

export interface PlatformPaymentsSettings {
  receivePayments: boolean;
  routingDestination: string;
  routingNotes: string;
}

export interface PlatformPageControlSettings {
  disabledPaths: string[];
}

export interface PlatformSettingsRecord {
  appearance: PlatformAppearanceSettings;
  localization: PlatformLocalizationSettings;
  library: {
    books: PlatformMediaItem[];
    videos: PlatformMediaItem[];
  };
  messaging: PlatformMessagingSettings;
  payments: PlatformPaymentsSettings;
  pageControl: PlatformPageControlSettings;
  adminAccess: {
    password: string;
  };
  updatedBy?: string;
  updatedAt?: Timestamp;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsRecord = {
  appearance: {
    primaryColor: "#1a3a52",
    secondaryColor: "#ffd700",
    textColor: "#171717",
    backgroundColor: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    backgroundImageUrl: "",
  },
  localization: {
    defaultLanguage: "ar",
    enabledLanguages: ["ar", "en"],
  },
  library: {
    books: [],
    videos: [],
  },
  messaging: {
    allowTextMessages: true,
    allowVoiceMessages: true,
  },
  payments: {
    receivePayments: true,
    routingDestination: "",
    routingNotes: "",
  },
  pageControl: {
    disabledPaths: [],
  },
  adminAccess: {
    password: "admin123",
  },
};

export async function saveMessage(data: AppMessageInput) {
  ensureFirestoreReady();
  const resolvedStatus = data.status || (data.senderRole === "admin" ? "replied" : "new");
  return addDoc(collection(db!, "messages"), {
    messageType: "text",
    ...data,
    status: resolvedStatus,
    createdAt: serverTimestamp(),
  });
}

export async function uploadVoiceMessageAndSave(data: {
  userId: string;
  senderId?: string;
  roomId: string;
  senderRole: "user" | "admin";
  language: string;
  blob: Blob;
  audioDurationSeconds?: number;
}) {
  ensureFirestoreReady();

  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const extension = data.blob.type.includes("webm") ? "webm" : "ogg";
  const filePath = `voice-messages/${data.userId}/${Date.now()}.${extension}`;
  const fileRef = ref(storage, filePath);

  await uploadBytes(fileRef, data.blob, {
    contentType: data.blob.type || "audio/webm",
  });

  const audioUrl = await getDownloadURL(fileRef);

  return saveMessage({
    userId: data.userId,
    senderId: data.senderId,
    roomId: data.roomId,
    senderRole: data.senderRole,
    text: "[Voice Message]",
    language: data.language,
    messageType: "audio",
    audioUrl,
    audioMimeType: data.blob.type || "audio/webm",
    audioDurationSeconds: data.audioDurationSeconds,
  });
}

function toMessageRecord(docSnap: QueryDocumentSnapshot): ChatMessageRecord {
  const data = docSnap.data() as Omit<ChatMessageRecord, "id">;
  return {
    id: docSnap.id,
    ...data,
  };
}

export function subscribeToUserMessages(
  userId: string,
  callback: (messages: ChatMessageRecord[]) => void,
) {
  ensureFirestoreReady();
  const messagesRef = collection(db!, "messages");
  const messagesQuery = query(
    messagesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    callback(snapshot.docs.map(toMessageRecord));
  });
}

export function subscribeToAllMessagesForAdmin(
  callback: (messages: ChatMessageRecord[]) => void,
) {
  ensureFirestoreReady();
  const messagesRef = collection(db!, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(messagesQuery, (snapshot) => {
    callback(snapshot.docs.map(toMessageRecord));
  });
}

export async function markUserMessagesAsReplied(userId: string) {
  ensureFirestoreReady();
  const messagesRef = collection(db!, "messages");
  const pendingUserMessagesQuery = query(
    messagesRef,
    where("userId", "==", userId),
    where("senderRole", "==", "user"),
    where("status", "==", "new"),
  );

  const pendingSnapshot = await getDocs(pendingUserMessagesQuery);
  if (pendingSnapshot.empty) {
    return;
  }

  const batch = writeBatch(db!);
  pendingSnapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { status: "replied" });
  });

  await batch.commit();
}

export async function saveOrder(data: AppOrderInput) {
  ensureFirestoreReady();
  return addDoc(collection(db!, "orders"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToUsersForAdmin(
  callback: (users: AdminUserRecord[]) => void,
) {
  ensureFirestoreReady();
  const usersRef = collection(db!, "users");
  const usersQuery = query(usersRef, orderBy("updatedAt", "desc"));

  return onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AdminUserRecord, "id">),
    }));

    callback(users);
  });
}

export function subscribeToOrdersForAdmin(
  callback: (orders: AdminOrderRecord[]) => void,
) {
  ensureFirestoreReady();
  const ordersRef = collection(db!, "orders");
  const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));

  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AdminOrderRecord, "id">),
    }));

    callback(orders);
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "paid" | "failed",
) {
  ensureFirestoreReady();

  const orderRef = doc(db!, "orders", orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function hasPaidConsultationAccess(userId: string): Promise<boolean> {
  ensureFirestoreReady();

  const ordersRef = collection(db!, "orders");
  const paidOrdersQuery = query(
    ordersRef,
    where("userId", "==", userId),
    where("type", "==", "booking"),
    where("status", "==", "paid"),
  );

  const snapshot = await getDocs(paidOrdersQuery);
  if (snapshot.empty) {
    return false;
  }

  return snapshot.docs.some((docSnap) => {
    const data = docSnap.data() as { planId?: string };
    if (typeof data.planId !== "string") return false;
    return data.planId.startsWith("consultation-") && data.planId !== "consultation-free-first";
  });
}

export async function hasUsedFirstFreeConsultation(userId: string): Promise<boolean> {
  ensureFirestoreReady();

  const ordersRef = collection(db!, "orders");
  const freeOrderQuery = query(
    ordersRef,
    where("userId", "==", userId),
    where("type", "==", "booking"),
    where("planId", "==", "consultation-free-first"),
  );

  const snapshot = await getDocs(freeOrderQuery);
  return !snapshot.empty;
}

export async function grantPaidConsultationAccessByAdmin(
  userId: string,
  adminId: string,
) {
  ensureFirestoreReady();

  return saveOrder({
    userId,
    email: `${userId}@guest.alhuda.local`,
    type: "booking",
    planId: "consultation-admin-grant",
    planName: `Admin grant by ${adminId}`,
    amount: 0,
    currency: "SAR",
    paymentIntentId: `admin-grant-${Date.now()}`,
    status: "paid",
  });
}

export function subscribeToPaidConsultationOrders(
  callback: (orders: PaidConsultationOrderRecord[]) => void,
) {
  ensureFirestoreReady();

  const ordersRef = collection(db!, "orders");
  const paidOrdersQuery = query(
    ordersRef,
    where("type", "==", "booking"),
    where("status", "==", "paid"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(paidOrdersQuery, (snapshot) => {
    const paidConsultationOrders = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<PaidConsultationOrderRecord, "id">) }))
      .filter((order) => typeof order.planId === "string" && order.planId.startsWith("consultation-") && order.planId !== "consultation-free-first");

    callback(paidConsultationOrders);
  });
}

export async function saveBooking(data: AppBookingInput) {
  ensureFirestoreReady();
  return addDoc(collection(db!, "bookings"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export interface VoiceCallRecord {
  id: string;
  userId: string;
  roomName: string;
  roomDescription: string;
  status: "waiting" | "active" | "ended";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createVoiceCallNotification(data: {
  userId: string;
  roomName: string;
  roomDescription: string;
}) {
  ensureFirestoreReady();
  return addDoc(collection(db!, "voiceCalls"), {
    ...data,
    status: "waiting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateVoiceCallStatus(
  callId: string,
  status: "waiting" | "active" | "ended",
) {
  ensureFirestoreReady();
  const callRef = doc(db!, "voiceCalls", callId);
  await updateDoc(callRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToVoiceCallsForAdmin(
  callback: (calls: VoiceCallRecord[]) => void,
) {
  ensureFirestoreReady();
  const callsRef = collection(db!, "voiceCalls");
  const callsQuery = query(
    callsRef,
    where("status", "in", ["waiting", "active"]),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(callsQuery, (snapshot) => {
    const calls = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<VoiceCallRecord, "id">),
    }));
    callback(calls);
  });
}

function mergePlatformSettings(
  incoming: Partial<PlatformSettingsRecord> | undefined,
): PlatformSettingsRecord {
  if (!incoming) return DEFAULT_PLATFORM_SETTINGS;

  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...incoming,
    appearance: {
      ...DEFAULT_PLATFORM_SETTINGS.appearance,
      ...(incoming.appearance || {}),
    },
    localization: {
      ...DEFAULT_PLATFORM_SETTINGS.localization,
      ...(incoming.localization || {}),
      enabledLanguages: incoming.localization?.enabledLanguages || DEFAULT_PLATFORM_SETTINGS.localization.enabledLanguages,
    },
    library: {
      books: incoming.library?.books || DEFAULT_PLATFORM_SETTINGS.library.books,
      videos: incoming.library?.videos || DEFAULT_PLATFORM_SETTINGS.library.videos,
    },
    messaging: {
      ...DEFAULT_PLATFORM_SETTINGS.messaging,
      ...(incoming.messaging || {}),
    },
    payments: {
      ...DEFAULT_PLATFORM_SETTINGS.payments,
      ...(incoming.payments || {}),
    },
    pageControl: {
      ...DEFAULT_PLATFORM_SETTINGS.pageControl,
      ...(incoming.pageControl || {}),
      disabledPaths: incoming.pageControl?.disabledPaths || DEFAULT_PLATFORM_SETTINGS.pageControl.disabledPaths,
    },
    adminAccess: {
      ...DEFAULT_PLATFORM_SETTINGS.adminAccess,
      ...(incoming.adminAccess || {}),
    },
  };
}

export function subscribeToPlatformSettings(
  callback: (settings: PlatformSettingsRecord) => void,
) {
  ensureFirestoreReady();
  const settingsRef = doc(db!, "platformSettings", "main");

  return onSnapshot(settingsRef, (snapshot) => {
    const raw = snapshot.exists()
      ? (snapshot.data() as Partial<PlatformSettingsRecord>)
      : undefined;
    callback(mergePlatformSettings(raw));
  });
}

export async function getPlatformSettings(): Promise<PlatformSettingsRecord> {
  ensureFirestoreReady();
  const settingsRef = doc(db!, "platformSettings", "main");
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return DEFAULT_PLATFORM_SETTINGS;
  }

  return mergePlatformSettings(snapshot.data() as Partial<PlatformSettingsRecord>);
}

export async function savePlatformSettings(
  data: Partial<PlatformSettingsRecord>,
  updatedBy: string,
) {
  ensureFirestoreReady();
  const settingsRef = doc(db!, "platformSettings", "main");
  const current = await getPlatformSettings();
  const merged = mergePlatformSettings({ ...current, ...data });

  await setDoc(
    settingsRef,
    {
      ...merged,
      updatedBy,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
