"use client";
import { useState } from "react";

const GUIDE_ANGLES = [
  { emoji: "✋", label: "손" },
  { emoji: "🥤", label: "컵" },
  { emoji: "🦶", label: "발" },
  { emoji: "🪟", label: "창밖" },
];

export function CameraGuide({ onDismiss }: { onDismiss: () => void }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
      <p className="font-bold text-sm mb-1">얼굴이 나오지 않아도 괜찮아요!</p>
      <p className="text-xs text-[#666] mb-3">
        손 · 컵 · 발 · 창밖처럼, 얼굴이 나오지 않는 앵글로 촬영해주세요.
      </p>

      {!showDetail ? (
        <button
          onClick={() => setShowDetail(true)}
          className="text-xs font-bold text-[#1F6F5C] underline"
        >
          예시 보기
        </button>
      ) : (
        <div className="flex gap-4 mb-3">
          {GUIDE_ANGLES.map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-[#C9EDE0] flex items-center justify-center text-lg">
                {a.emoji}
              </div>
              <span className="text-[10px] text-[#666]">{a.label}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onDismiss}
        className="mt-2 w-full py-2.5 rounded-full bg-[#6FCDB3] text-white text-xs font-bold"
      >
        확인했어요
      </button>
    </div>
  );
}