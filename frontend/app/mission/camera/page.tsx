"use client";
import { useCamera } from "@/lib/hooks/useCamera";

export default function CameraPage() {
  const { videoRef, status, requestCamera } = useCamera();

  if (status === "denied") {
    return (
      <div>
        <p>카메라 권한이 필요해요. 설정에서 허용해주세요.</p>
        <button onClick={requestCamera}>다시 요청</button>
      </div>
    );
  }

  if (status === "error") return <div>카메라를 사용할 수 없어요.</div>;

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%" }} />
    </div>
  );
}