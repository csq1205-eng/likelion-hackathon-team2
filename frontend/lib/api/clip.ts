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

  const response = await fetch(`/api/clips/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  let json: any = {};

  try {
    json = await response.json();
  } catch (e) {
    console.error("서버 응답이 JSON이 아닙니다:", e);
  }

  if (!response.ok) {
    console.error("클립 업로드 API 에러:", {
      status: response.status,
      code: json?.code,
      message: json?.message,
      response: json,
    });

    const errorMessage =
      json?.message ||
      json?.error ||
      `업로드 실패 (Status: ${response.status})`;

    const errorCode = json?.code
      ? ` [코드: ${json.code}]`
      : "";

    throw new Error(`${errorMessage}${errorCode}`);
  }

  return json.data as ClipUploadResponse;
}