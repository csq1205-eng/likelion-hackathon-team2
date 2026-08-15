"use client";
import { getStreak, type StreakResponse } from "@/lib/api/streak";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getTodayMissions, type Mission } from "@/lib/api/mission";

const SLOT_LABEL: Record<string, string> = {
  MORNING: "아침",
  AFTERNOON: "낮",
  EVENING: "저녁",
};

export default function MissionPage() {
  const router = useRouter();
  const { accessToken, userId, isLoading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (authLoading || !accessToken) return;
  fetchMissions();
  fetchStreak();
}, [authLoading, accessToken]);

  async function fetchMissions() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await getTodayMissions(accessToken);
      setMissions(res.missions);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("미션을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStreak() {
  if (!accessToken) return;
  try {
    const res = await getStreak(userId!, accessToken);
    setStreak(res);
  } catch (err) {
    console.error("스트릭 조회 실패:", err);
    // 스트릭은 실패해도 화면 전체를 막을 필요 없어서 조용히 무시
  }
}

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-sm text-[#999]">불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#999]">{error}</p>
        <button onClick={fetchMissions} className="text-sm text-[#1F6F5C] underline">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <h1 className="text-xl font-bold mb-6">오늘의 미션</h1>

      {streak && streak.currentStreakDays > 0 && (
  <div className="inline-flex items-center gap-1 bg-[#C9EDE0] text-[#1F6F5C] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
    🔥 {streak.currentStreakDays}일 연속
  </div>
)}

      {(!missions || missions.length === 0) && (
        <p className="text-sm text-[#999]">오늘은 준비된 미션이 없어요.</p>
      )}

      <div className="space-y-3">
        {missions?.map((m) => (
          <button
            key={m.missionId}
            onClick={() => router.push(`/mission/camera?missionId=${m.missionId}`)}
            disabled={m.status === "PASS"}
            className="w-full text-left bg-white rounded-2xl p-5 shadow-sm disabled:opacity-50"
          >
            <span className="inline-block text-xs font-bold text-[#1F6F5C] bg-[#C9EDE0] px-2 py-1 rounded-full mb-2">
              {SLOT_LABEL[m.slot] ?? m.slot}
            </span>
            <p className="font-bold mb-1">{m.title}</p>
            <p className="text-sm text-[#666] mb-2">{m.description}</p>
            <p className="text-xs text-[#999]">{m.reason}</p>
            {m.status === "PASS" && (
              <p className="text-xs text-[#1F6F5C] font-bold mt-2">✓ 완료됨</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}