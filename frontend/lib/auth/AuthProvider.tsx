"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loginWithTestAccount, type LoginResponse } from "@/lib/api/auth";

interface AuthContextValue {
  accessToken: string | null; userId: number | null;
  onboardingCompleted: boolean; requiredConsentCompleted: boolean;
  isLoading: boolean; error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "welllog_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextValue>({
    accessToken: null, userId: null, onboardingCompleted: false,
    requiredConsentCompleted: false, isLoading: true, error: null,
  });

  useEffect(() => { initializeAuth(); }, []);

  async function initializeAuth() {
    const cached = readCachedAuth();
    if (cached) { setAuthState({ ...cached, isLoading: false, error: null }); return; }
    try {
      const result = await loginWithTestAccount();
      saveCachedAuth(result);
      setAuthState({
        accessToken: result.accessToken, userId: result.userId,
        onboardingCompleted: result.onboardingCompleted,
        requiredConsentCompleted: result.requiredConsentCompleted,
        isLoading: false, error: null,
      });
    } catch {
      setAuthState((prev) => ({ ...prev, isLoading: false, error: "로그인에 실패했어요." }));
    }
  }

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있어요.");
  return context;
}

function readCachedAuth(): Omit<AuthContextValue, "isLoading" | "error"> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveCachedAuth(result: LoginResponse) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accessToken: result.accessToken, userId: result.userId,
    onboardingCompleted: result.onboardingCompleted,
    requiredConsentCompleted: result.requiredConsentCompleted,
  }));
}