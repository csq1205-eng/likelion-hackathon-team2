"use client";
import { useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "granted" | "denied" | "error">("idle");

  useEffect(() => {
    requestCamera();
    return () => stopCamera();
  }, []);

  async function requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("granted");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  return { videoRef, streamRef, status, requestCamera };
}