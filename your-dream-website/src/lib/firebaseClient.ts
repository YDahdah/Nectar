import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
};

function readFirebaseConfigFromEnv(): FirebaseClientConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
  };
}

export function isFirebaseClientConfigured(): boolean {
  return readFirebaseConfigFromEnv() != null;
}

export function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const cfg = readFirebaseConfigFromEnv();
  if (!cfg) {
    throw new Error(
      "Firebase client is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID."
    );
  }

  return initializeApp(cfg);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function tryGetFirebaseAuth() {
  try {
    if (!isFirebaseClientConfigured()) return null;
    return getFirebaseAuth();
  } catch {
    return null;
  }
}

