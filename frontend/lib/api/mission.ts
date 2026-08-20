import { apiRequest } from "./client";

export interface Mission {
  missionId: number;
  slot: "MORNING" | "NOON" | "EVENING";
  title: string;
  description: string;
  missionType: string;
  status: "PENDING" | "SUBMITTED" | "PASSED" | "FAILED" | "SKIPPED";
  reason: string;
}

export interface TodayMissionsResponse {
  date: string;
  missions: Mission[];
}

export async function getTodayMissions(accessToken: string) {
  return apiRequest<TodayMissionsResponse>("/missions/today", {
    method: "GET",
    accessToken,
  });
}