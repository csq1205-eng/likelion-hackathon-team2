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
  accessToken: string
): Promise<ClipUploadResponse> {
  const formData = new FormData();
  formData.append("missionId", String(missionId));
  formData.append("shared", String(shared));
  // 서버는 mp4/mov만 받는다고 명시되어 있어서 파일명에 확장자를 붙여줌
  formData.append("clip", clip, "clip.mp4");

  const response = await fetch("/api/clips/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Content-Type은 FormData 사용 시 브라우저가 자동으로 boundary까지 설정하므로 직접 넣지 않음
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message ?? "클립 업로드에 실패했어요.");
  }

  return json.data as ClipUploadResponse;
}