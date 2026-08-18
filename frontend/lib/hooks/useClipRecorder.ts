"use client";
import { useRef, useState, useCallback } from "react";

const RECORD_DURATION_MS = 5000;

export function useClipRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;

    chunksRef.current = [];
    setRecordedBlob(null);
    setRecordedUrl(null);

    const mimeType = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      console.log("녹화 MIME 타입:", mimeType);
console.log("녹화 Blob 크기:", chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0));
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
    setCountdown(5);

    let remaining = 5;
    const timer = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, RECORD_DURATION_MS);
  }, [stream, isRecording]);

  const reset = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl(null);
  }, []);

  return { isRecording, countdown, recordedBlob, recordedUrl, startRecording, reset };
}