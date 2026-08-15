import { apiRequest } from "./client";

export interface OnboardingPayload {
  mainConcern: string;
  causeCandidates: string[];
  sleepHours: number;
  waterIntake: number;
  wakeUpTime: string;
  sleepTime: string;
  preferredMissionTypes: string[];
  avoidedMissionTypes: string[];
  ownedProducts: { category: string; hasProduct: boolean }[];
}

export async function saveOnboarding(payload: OnboardingPayload, accessToken: string) {
  return apiRequest<{ userId: number; onboardingCompleted: boolean }>(
    "/api/v1/users/onboarding",
    { method: "POST", body: payload, accessToken }
  );
}
