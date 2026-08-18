"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCamera } from "@/lib/hooks/useCamera";
import { useClipRecorder } from "@/lib/hooks/useClipRecorder";
import { CameraGuide } from "@/components/camera/CameraGuide";
import { useAuth } from "@/lib/auth/AuthProvider";
import { uploadClip, type ClipUploadResponse } from "@/lib/api/clip";
import { Button } from "@/components/ui/Button";

function CameraPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const missionId = Number(searchParams.get("missionId"));
  const { accessToken } = useAuth();

  const { videoRef, streamRef, status, requestCamera } = useCamera();
  const { isRecording, countdown, recordedBlob, recordedUrl, startRecording, reset } =
    useClipRecorder(streamRef.current);
  const [showGuide, setShowGuide] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<ClipUploadResponse | null>(null);

  async function handleSubmit() {
    if (!recordedBlob || !accessToken || !missionId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadClip(missionId, recordedBlob, false, accessToken);
      setResult(res);
    } catch (err) {
      console.error(err);
      setUploadError("업로드에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  }

  function handleRetry() {
    setResult(null);
    setUploadError(null);
    reset();
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

  // 업로드 + 판정까지 끝난 경우
  if (result) {
    const isPass = result.result === "PASS";
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-[28px] p-7 shadow-sm text-center">
          <p className="text-4xl mb-3">{isPass ? "✅" : "🔄"}</p>
          <h1 className="text-lg font-bold mb-2">
            {isPass ? "미션 완료!" : result.result === "HOLD" ? "판정 확인 중이에요" : "다시 촬영해주세요"}
          </h1>
          <p className="text-sm text-[#666] mb-6">{result.reason}</p>
          {!isPass && result.result !== "HOLD" && (
            <Button onClick={handleRetry}>다시 촬영하기</Button>
          )}
          {isPass && <Button onClick={() => router.push("/mission")}>미션으로 돌아가기</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {showGuide && <CameraGuide onDismiss={() => setShowGuide(false)} />}

        <div className="bg-white rounded-[28px] p-6 shadow-sm">
          <p className="text-sm text-[#999] mb-4">5초 클립 촬영</p>

          {status === "denied" && (
            <div className="aspect-[3/4] bg-[#ECECEC] rounded-2xl flex flex-col items-center justify-center gap-3 px-6">
              <p className="text-sm text-[#666] text-center">
                카메라 권한이 필요해요. 설정에서 허용해주세요.
              </p>
              <button onClick={requestCamera} className="px-4 py-2 rounded-full bg-[#6FCDB3] text-white text-xs font-bold">
                다시 요청
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="aspect-[3/4] bg-[#ECECEC] rounded-2xl flex items-center justify-center">
              <p className="text-sm text-[#666]">카메라를 사용할 수 없어요.</p>
            </div>
          )}

          {status === "granted" && !recordedUrl && (
            <div className="relative aspect-[3/4] bg-[#ECECEC] rounded-2xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isRecording && (
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {countdown}초
                </div>
              )}
            </div>
          )}

          {recordedUrl && (
            <div className="relative aspect-[3/4] bg-[#ECECEC] rounded-2xl overflow-hidden">
              <video src={recordedUrl} controls className="w-full h-full object-cover" />
            </div>
          )}

          {uploadError && <p className="text-xs text-red-500 mt-3">{uploadError}</p>}

          <div className="flex flex-col gap-2 mt-6">
            {!recordedUrl && (
              <button
                onClick={startRecording}
                disabled={isRecording || status !== "granted"}
                className="w-16 h-16 rounded-full border-4 border-[#6FCDB3] flex items-center justify-center disabled:opacity-40 mx-auto"
              >
                {isRecording && <span className="text-sm font-bold text-[#1F6F5C]">{countdown}</span>}
              </button>
            )}

            {recordedUrl && (
              <>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? "제출 중..." : "이 영상으로 제출하기"}
                </Button>
                <button onClick={reset} disabled={uploading} className="w-full py-3 text-sm text-[#999]">
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
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
      <CameraPageInner />
    </Suspense>
  );
}