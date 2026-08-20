import { API_B_URL } from "@/lib/api/client";

export interface ClipUploadResponse {
  missionId: number;
  clipId: number;
  sourceClipUrl: string | null;
  attemptNo: number;
  retryCount?: number;
  maxRetryCount?: number;
  remainingRetryCount?: number;
  frameCount: number;
  shared: boolean;
  judgementRequestId: number;
  judgementStatus: "REQUESTED" | "PROCESSING" | "COMPLETED" | "FAILED";
  result: "PASS" | "FAIL" | "HOLD" | "ERROR" | null;
  reason: string | null;
  confidenceScore: number | null;
  pollingIntervalSeconds?: number;
}

export async function uploadClip(
  missionId: number,
  clip: Blob,
  shared: boolean,
  accessToken: string,
  missionTitle: string,
  criteria: string
): Promise<ClipUploadResponse> {
  const formData = new FormData();

  formData.append("missionId", String(missionId));
  formData.append("shared", String(shared));
  formData.append("missionTitle", missionTitle);
  formData.append("criteria", criteria);
  formData.append("clip", clip, "clip.mp4");

  const response = await fetch(`${API_B_URL}/clips/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message ?? "클립 업로드에 실패했어요.");
  }

  return json.data as ClipUploadResponse;
}