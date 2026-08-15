"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getGroupProgress, type GroupProgressResponse } from "@/lib/api/group";
import { getTodayMissions, type Mission } from "@/lib/api/mission";
import { WPuzzle } from "@/components/garden/WPuzzle";
import { StampGrid } from "@/components/garden/StampGrid";

const NAV_ITEMS = [
  { emoji: "🏠", label: "홈", href: "/" },
  { emoji: "✅", label: "미션", href: "/mission" },
  { emoji: "🌱", label: "W 정원", href: "" }, // 현재 페이지, 아래서 groupId로 채움
  { emoji: "👥", label: "그룹", href: "/group" },
  { emoji: "📖", label: "기록", href: "/mypage" },
];

export default function GardenPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [data, setData] = useState<GroupProgressResponse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      getGroupProgress(Number(id), accessToken),
      getTodayMissions(accessToken).catch(() => ({ date: "", missions: [] })),
    ])
      .then(([progress, todayMissions]) => {
        setData(progress);
        setMissions(todayMissions.missions);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-sm text-[#999]">불러오는 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-sm text-[#999]">정원 정보를 불러오지 못했어요.</p>
      </div>
    );
  }

  const completedMissionCount = missions.filter((m) => m.status === "PASS").length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <p className="text-lg font-extrabold tracking-tight">WEDIT</p>
        <div className="flex items-center gap-3">
          <span className="text-lg">🔔</span>
          <div className="w-8 h-8 rounded-full bg-[#DCD6F7] flex items-center justify-center text-sm">
            🧑
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* 타이틀 */}
        <h1 className="text-xl font-bold mt-2 mb-1">
          {data.completed
            ? `W 정원을 완성했어요! 🎉`
            : `${data.completedDays}일째 함께 채우는 중이에요`}
        </h1>
        <p className="text-sm text-[#888] mb-2">
          {data.targetDays}일 동안 함께 채우는 모든 조각이에요.
        </p>

        {/* W 퍼즐 */}
        <WPuzzle percent={data.progressRate} />

        {/* 진행률 숫자 */}
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-sm text-[#888]">W 퍼즐 완성도</p>
            <p className="text-3xl font-extrabold text-[#1F6F5C]">
              {data.progressRate.toFixed(0)}%
            </p>
          </div>
          <p className="text-sm text-[#888]">
            {data.completedDays} / {data.targetDays}
            <br />
            조각 완성
          </p>
        </div>

        <p className="text-xs text-[#999] mb-6">
          <span className="text-[#6FCDB3]">●</span> 개인 스탬프 {data.personalStampCount}개
          {" + "}
          <span className="text-[#A99BE0]">●</span> 그룹 스탬프 {data.groupStampCount}개
        </p>

        {/* 스탬프 그리드 */}
        <div className="flex gap-3 mb-6">
          <StampGrid title="개인 스탬프" count={data.personalStampCount} emoji="🌱" color="mint" />
          <StampGrid title="그룹 스탬프" count={data.groupStampCount} emoji="👤" color="purple" />
        </div>

        {/* 오늘의 미션 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-sm">오늘의 미션</p>
            <p className="text-sm font-bold text-[#1F6F5C]">
              {completedMissionCount} / {missions.length} 완료
            </p>
          </div>
          <div className="space-y-2">
            {missions.map((m) => (
              <div key={m.missionId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-[#999]">{m.description}</p>
                </div>
                <span className={m.status === "PASS" ? "text-[#6FCDB3]" : "text-[#DDD]"}>
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 완성 리워드 배너 */}
        {data.completed && (
          <div className="bg-[#DCD6F7] rounded-2xl p-4 flex items-center gap-3 mb-6">
            <span className="text-3xl">🎁</span>
            <div className="flex-1">
              <p className="text-sm font-bold">W 정원 완성 리워드</p>
              <p className="text-xs text-[#666] mb-2">응모권과 맞춤 케어가 도착했어요!</p>
              <button className="w-full py-2 rounded-full bg-white text-xs font-bold text-[#5B4FA0]">
                완성 리워드 확인
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEE] flex justify-around py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href || `/group/${id}/garden`}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              item.label === "W 정원" ? "text-[#6FCDB3] font-bold" : "text-[#999]"
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}