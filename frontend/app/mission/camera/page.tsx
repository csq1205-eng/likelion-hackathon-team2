"use client";
import { useState } from "react";
import { useCamera } from "@/lib/hooks/useCamera";
import { useClipRecorder } from "@/lib/hooks/useClipRecorder";
import { CameraGuide } from "@/components/camera/CameraGuide";

export default function CameraPage() {
  const { videoRef, streamRef, status, requestCamera } = useCamera();
  const { isRecording, countdown, recordedUrl, startRecording, reset } =
    useClipRecorder(streamRef.current);
  const [showGuide, setShowGuide] = useState(true);

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
              <p className="text-sm text-[#666]">카메라를 사용할 수 없어요.</p>
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
              <video src={recordedUrl} controls className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex justify-center mt-6">
            {!recordedUrl ? (
              <button
                onClick={startRecording}
                disabled={isRecording || status !== "granted"}
                className="w-16 h-16 rounded-full border-4 border-[#6FCDB3] flex items-center justify-center disabled:opacity-40"
              >
                {isRecording && (
                  <span className="text-sm font-bold text-[#1F6F5C]">{countdown}</span>
                )}
              </button>
            ) : (
              <button
                onClick={reset}
                className="px-6 py-3 rounded-full bg-[#ECECEC] text-[#555] text-sm font-bold"
              >
                다시 촬영
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}