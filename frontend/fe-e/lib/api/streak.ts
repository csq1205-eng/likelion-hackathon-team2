import { apiRequest } from "./client";

export interface StreakResponse {
  userId: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastCompletedDate: string | null;
}

export async function getStreak(userId: number, accessToken: string) {
  return apiRequest<StreakResponse>(`/api/v1/users/${userId}/streak`, {
    method: "GET",
    accessToken,
  });
}