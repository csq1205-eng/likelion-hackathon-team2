"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loginWithTestAccount, type LoginResponse } from "../api/auth";

interface AuthContextValue {
  accessToken: string | null; 
  userId: number | null;
  onboardingCompleted: boolean; 
  requiredConsentCompleted: boolean;
  isLoading: boolean; 
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "wedit_auth";

const MOCK_FALLBACK_AUTH = {
  accessToken: "mock-access-token-999999",
  userId: 1,
  onboardingCompleted: true,
  requiredConsentCompleted: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextValue>({
    accessToken: null, 
    userId: null, 
    onboardingCompleted: false,
    requiredConsentCompleted: false, 
    isLoading: true, 
    error: null,
  });

  useEffect(() => { 
    initializeAuth(); 
  }, []);

  async function initializeAuth() {
    // 기존 저장 캐시 확인
    const cached = readCachedAuth();
    if (cached) { 
      setAuthState({ ...cached, isLoading: false, error: null }); 
      return; 
    }

    try {
      const result = await loginWithTestAccount();
      saveCachedAuth(result);
      setAuthState({
        accessToken: result.accessToken, 
        userId: result.userId,
        onboardingCompleted: result.onboardingCompleted,
        requiredConsentCompleted: result.requiredConsentCompleted,
        isLoading: false, 
        error: null,
      });
    } catch (error) {
      // 백엔드 서버가 응답하지 않을 때 : 가짜 데이터 렌더링
      console.warn("백엔드 서버가 응답하지 않아 임시 데이터로 자동 전환합니다.", error);
      saveCachedAuth(MOCK_FALLBACK_AUTH);
      setAuthState({ 
        ...MOCK_FALLBACK_AUTH, 
        isLoading: false, 
        error: null 
      });
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

function saveCachedAuth(result: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accessToken: result.accessToken, 
    userId: result.userId,
    onboardingCompleted: result.onboardingCompleted,
    requiredConsentCompleted: result.requiredConsentCompleted,
  }));
}