import { apiRequest } from "./client";

export interface LoginResponse {
  userId: number; accessToken: string; refreshToken: string; tokenType: string;
  isNewUser: boolean; onboardingCompleted: boolean; requiredConsentCompleted: boolean;
}

const TEST_PROVIDER = process.env.NEXT_PUBLIC_TEST_PROVIDER ?? "KAKAO";
const TEST_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TEST_SOCIAL_TOKEN ?? "test-account-1";

export async function loginWithTestAccount(): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { provider: TEST_PROVIDER, socialAccessToken: TEST_ACCESS_TOKEN },
  });
}