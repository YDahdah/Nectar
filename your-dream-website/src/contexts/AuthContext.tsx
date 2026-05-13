import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged, signInAnonymously, getIdToken } from "firebase/auth";
import { isFirebaseClientConfigured, tryGetFirebaseAuth } from "@/lib/firebaseClient";

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  /**
   * Returns a freshly refreshed ID token for the current user.
   * Throws if user is missing.
   */
  getFreshIdToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const auth = tryGetFirebaseAuth();
    if (!auth) {
      // Firebase is optional at runtime; app should still render without crashing.
      setIsReady(true);
      setUser(null);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      try {
        if (!nextUser) {
          // Guarantee each visitor gets a distinct Firebase Auth session.
          await signInAnonymously(auth);
          return;
        }
        setUser(nextUser);
      } finally {
        setIsReady(true);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      getFreshIdToken: async () => {
        if (!isFirebaseClientConfigured()) {
          throw new Error(
            "Firebase client is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID."
          );
        }
        const auth = tryGetFirebaseAuth();
        if (!auth) throw new Error("Auth unavailable. Please refresh and try again.");
        const current = auth.currentUser;
        if (!current) throw new Error("User not authenticated");
        return await getIdToken(current, true);
      },
    }),
    [user, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

