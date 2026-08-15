import { apiRequest } from "./client";

export interface GroupSummaryResponse {
  groupId: number;
  name: string;
  goalName: string;
  targetDays: number;
  memberCount: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  progressRate: number;
}

export interface MyGroupsResponse {
  groups: GroupSummaryResponse[];
}

export async function getMyGroups(accessToken: string) {
  return apiRequest<MyGroupsResponse>("/api/v1/groups", {
    method: "GET",
    accessToken,
  });
}

// --- 제가 추가 (W정원 진행률) ---
export interface GroupProgressResponse {
  groupId: number;
  name: string;
  goalName: string;
  targetDays: number;
  completedDays: number;
  remainingDays: number;
  progressRate: number;
  completed: boolean;
  personalStampCount: number;
  groupStampCount: number;
}

export async function getGroupProgress(groupId: number, accessToken: string) {
  return apiRequest<GroupProgressResponse>(`/api/v1/groups/${groupId}/progress`, {
    method: "GET",
    accessToken,
  });
}