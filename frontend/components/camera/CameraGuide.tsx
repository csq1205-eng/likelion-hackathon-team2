"use client";
import { useState } from "react";

const GUIDE_ANGLES = [
  { emoji: "✋", label: "손", desc: "손을 클로즈업으로 촬영해보세요" },
  { emoji: "🥤", label: "컵", desc: "물 마시는 컵을 비춰보세요" },
  { emoji: "🦶", label: "발", desc: "발이나 신발을 비춰보세요" },
  { emoji: "🪟", label: "창밖", desc: "창밖 풍경을 비춰보세요" },
];

export function CameraGuide({ onDismiss }: { onDismiss: () => void }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div style={{ padding: 16, background: "#f5f5f5", borderRadius: 8, marginBottom: 12 }}>
      <p style={{ fontWeight: "bold" }}>얼굴이 나오지 않아도 괜찮아요!</p>
      <p style={{ fontSize: 14 }}>
        손 · 컵 · 발 · 창밖처럼, 얼굴이 나오지 않는 앵글로 촬영해주세요.
      </p>

      {!showDetail ? (
        <button onClick={() => setShowDetail(true)}>예시 보기</button>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          {GUIDE_ANGLES.map((a) => (
            <div key={a.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{a.emoji}</div>
              <div style={{ fontSize: 12 }}>{a.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button onClick={onDismiss}>확인했어요</button>
      </div>
    </div>
  );
}