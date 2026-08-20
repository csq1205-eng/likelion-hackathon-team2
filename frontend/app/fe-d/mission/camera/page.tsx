"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks/useCamera";
import { useClipRecorder } from "@/lib/hooks/useClipRecorder";
import { CameraGuide } from "@/components/camera/CameraGuide";
import { useAuth } from "@/lib/auth/AuthProvider";
import { uploadClip } from "@/lib/api/clip";
import { getTodayMissions, type Mission } from "@/lib/api/mission";
import { Button } from "@/components/ui/Button";

function formatVerificationCriteria(criteria: string): string[] {
  try {
    const parsed = JSON.parse(criteria);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => item.description)
        .filter(Boolean);
    }

    return [criteria];
  } catch {
    return [criteria];
  }
}

function CameraPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const missionId = Number(searchParams.get("missionId"));
  const { accessToken } = useAuth();

  const { videoRef, stream, status, requestCamera } = useCamera();

  const {
    isRecording,
    countdown,
    recordedBlob,
    recordedUrl,
    startRecording,
    reset,
  } = useClipRecorder(stream);

  const [mission, setMission] = useState<Mission | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !missionId) return;

    const token = accessToken;

    async function fetchMission() {
      try {
        const res = await getTodayMissions(token);

        const foundMission = res.missions.find(
          (m) => m.missionId === missionId
        );

        if (!foundMission) {
          throw new Error("미션을 찾을 수 없어요.");
        }

        setMission(foundMission);
      } catch (err) {
        console.error("미션 조회 실패:", err);
        setUploadError("미션 정보를 불러오지 못했어요.");
      }
    }

    fetchMission();
  }, [accessToken, missionId]);

  async function handleSubmit() {
    if (
      !recordedBlob ||
      !accessToken ||
      !missionId ||
      !mission
    ) {
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const res = await uploadClip(
        missionId,
        recordedBlob,
        false,
        accessToken,
        mission.title,
        mission.verificationCriteria
      );

      router.push(
        `/fe-e/mission/result?clipId=${res.clipId}&retryCount=${
          res.remainingRetryCount ?? 0
        }`
      );
    } catch (err: any) {
      console.error("클립 업로드 상세 에러:", err);

      const displayMessage =
        err?.message || "업로드에 실패했어요. 다시 시도해주세요.";

      setUploadError(displayMessage);
      setUploading(false);
    }
  }

  if (!missionId) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <p className="text-sm text-[#999]">
          미션 정보가 없어요. 미션 목록에서 다시 들어와주세요.
        </p>
      </div>
    );
  }

  const verificationCriteria = mission
    ? formatVerificationCriteria(mission.verificationCriteria)
    : [];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {showGuide && (
          <CameraGuide onDismiss={() => setShowGuide(false)} />
        )}

        <div className="bg-white rounded-[28px] p-6 shadow-sm">
          <p className="text-sm text-[#999] mb-4">
            5초 클립 촬영
          </p>

          {mission && (
            <div className="mb-4">
              <p className="font-bold">{mission.title}</p>

              <div className="mt-2">
                <p className="text-xs font-bold text-[#666] mb-1">
                  판정 기준
                </p>

                <ul className="space-y-1">
                  {verificationCriteria.map((criterion, index) => (
                    <li
                      key={index}
                      className="text-xs text-[#999] pl-2"
                    >
                      • {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {status === "denied" && (
            <div className="aspect-[3/4] bg-[#ECECEC] rounded-2xl flex flex-col items-center justify-center gap-3 px-6">
              <p className="text-sm text-[#666] text-center">
                카메라 권한이 필요해요. 설정에서 허용해주세요.
              </p>

              <button
                onClick={requestCamera}
                className="px-4 py-2 rounded-full bg-[#6FCDB3] text-white text-xs font-bold"
              >
                다시 요청
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="aspect-[3/4] bg-[#ECECEC] rounded-2xl flex items-center justify-center">
              <p className="text-sm text-[#666]">
                카메라를 사용할 수 없어요.
              </p>
            </div>
          )}

          {status === "granted" && !recordedUrl && (
            <div className="relative aspect-[3/4] bg-[#ECECEC] rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {isRecording && (
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {countdown}초
                </div>
              )}
            </div>
          )}

          {recordedUrl && (
            <div className="relative aspect-[3/4] bg-[#ECECEC] rounded-2xl overflow-hidden">
              <video
                src={recordedUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-500 mt-3">
              {uploadError}
            </p>
          )}

          <div className="flex flex-col gap-2 mt-6">
            {!recordedUrl && (
              <button
                onClick={startRecording}
                disabled={isRecording || status !== "granted"}
                className="w-16 h-16 rounded-full border-4 border-[#6FCDB3] flex items-center justify-center disabled:opacity-40 mx-auto"
              >
                {isRecording && (
                  <span className="text-sm font-bold text-[#1F6F5C]">
                    {countdown}
                  </span>
                )}
              </button>
            )}

            {recordedUrl && (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={uploading || !mission}
                >
                  {uploading
                    ? "제출 중..."
                    : "이 영상으로 제출하기"}
                </Button>

                <button
                  onClick={() => {
                    reset();
                    requestCamera();
                  }}
                  disabled={uploading}
                  className="w-full py-3 text-sm text-[#999]"
                >
                  다시 촬영
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CameraPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F5]" />
      }
    >
      <CameraPageInner />
    </Suspense>
  );
}