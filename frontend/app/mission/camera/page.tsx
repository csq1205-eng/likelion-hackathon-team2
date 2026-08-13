"use client";

import { useState } from "react";
import { CameraGuide } from "@/components/camera/CameraGuide";
import { useCamera } from "@/lib/hooks/useCamera";
import { useClipRecorder } from "@/lib/hooks/useClipRecorder";

export default function CameraPage() {
  const [showGuide, setShowGuide] = useState(true);
  const { videoRef, streamRef, status, requestCamera } = useCamera();
  const { isRecording, countdown, recordedUrl, startRecording, reset } =
    useClipRecorder(streamRef.current);

  if (status === "denied") {
    return (
      <div>
        <p>카메라 권한이 필요해요. 설정에서 허용해주세요.</p>
        <button onClick={requestCamera}>다시 요청</button>
      </div>
    );
  }

  if (status === "error") {
    return <div>카메라를 사용할 수 없어요.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {showGuide && (
        <CameraGuide onDismiss={() => setShowGuide(false)} />
      )}

      {!recordedUrl && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%" }}
          />

          {isRecording && <p>녹화 중... {countdown}초</p>}

          <button
            onClick={startRecording}
            disabled={isRecording || status !== "granted"}
          >
            {isRecording ? "녹화 중" : "촬영 시작"}
          </button>
        </>
      )}

      {recordedUrl && (
        <>
          <video src={recordedUrl} controls style={{ width: "100%" }} />
          <button onClick={reset}>다시 촬영</button>
        </>
      )}
    </div>
  );
}