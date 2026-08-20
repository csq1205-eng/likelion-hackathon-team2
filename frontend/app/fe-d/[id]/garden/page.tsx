"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  getGroupProgress,
  type GroupProgressResponse,
} from "@/lib/api/group";
import {
  getTodayMissions,
  type Mission,
} from "@/lib/api/mission";
import { WPuzzle } from "@/components/garden/WPuzzle";
import { StampGrid } from "@/components/garden/StampGrid";

const NAV_ITEMS = [
  { emoji: "🏠", label: "홈", href: "/" },
  { emoji: "✅", label: "미션", href: "/fe-d/mission" },
  { emoji: "🌱", label: "W 정원", href: "" },
  { emoji: "👥", label: "그룹", href: "/fe-e/group" },
  { emoji: "📖", label: "기록", href: "/fe-e/record/calendar" },
];

export default function GardenPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { accessToken, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<GroupProgressResponse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    const groupId = Number(id);

    if (Number.isNaN(groupId)) {
      console.error("잘못된 그룹 ID:", id);
      setLoading(false);
      return;
    }

    Promise.all([
      getGroupProgress(groupId, accessToken),
      getTodayMissions(accessToken).catch(() => ({
        date: "",
        missions: [],
      })),
    ])
      .then(([progress, todayMissions]) => {
        setData(progress);
        setMissions(todayMissions.missions);
      })
      .catch((err) => {
        console.error("정원 데이터를 불러오지 못했습니다.", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, accessToken, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center">
        <p className="text-sm text-[#8A9A92]">
          정원을 불러오는 중...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center px-5">
        <p className="text-sm text-[#999] text-center">
          정원 정보를 불러오지 못했어요.
        </p>
      </div>
    );
  }

  const percent = Math.round(data.progressRate);

  const completedMissionCount = missions.filter(
    (mission) => mission.status === "PASSED"
  ).length;

  return (
    <div className="flex min-h-screen justify-center bg-[#F4F6F5] pb-20">
      <div className="flex w-full max-w-sm flex-col bg-[#F4F6F5]">

        {/* 상단 브랜드 바 */}
        <header className="flex items-center justify-between px-5 pb-2 pt-5">
          <h1 className="text-xl font-extrabold tracking-tight text-[#3BB985]">
            WEDIT
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="알림"
              className="text-lg"
            >
              🔔
            </button>

            <div className="h-8 w-8 overflow-hidden rounded-full bg-[#DDEBE4] ring-2 ring-white">
              <div className="flex h-full w-full items-center justify-center bg-[#CDE9DD] text-xs font-bold text-[#3BB985]">
                W
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-4 px-5 pb-6">

          {/* 인사 영역 */}
          <div className="pt-1">
            <p className="text-lg font-bold text-[#1F2A25]">
              {data.completed ? (
                <>
                  <span className="text-[#3BB985]">W 정원</span>을
                  완성했어요! 🎉
                </>
              ) : (
                <>
                  <span className="text-[#3BB985]">W 정원</span>을
                  함께 채우는 중이에요 🌱
                </>
              )}
            </p>

            <p className="mt-1 text-[13px] text-[#8A9A92]">
              {data.targetDays}일 동안 함께 채우는 모든 조각이에요.
            </p>
          </div>

          {/* W 퍼즐 */}
          <div className="relative flex items-center justify-center py-2">
            <WPuzzle percent={percent} />
          </div>

          {/* 완성도 카드 */}
          <section className="rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(31,42,37,0.05)]">
            <div className="flex items-end justify-between">

              <div>
                <p className="text-xs font-semibold text-[#8A9A92]">
                  W 퍼즐 완성도
                </p>

                <p className="mt-1 text-4xl font-extrabold leading-none text-[#3BB985]">
                  {percent}%
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-extrabold text-[#2B3A33]">
                  {data.completedDays} / {data.targetDays}
                </p>

                <p className="text-xs text-[#9AA8A1]">
                  조각 완성
                </p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#E9ECEB]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7BD4B0] to-[#3BB985] transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* 스탬프 수 */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#8A9A92]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#3BB985]" />

              개인 스탬프 {data.personalStampCount}개

              <span className="mx-0.5 text-[#C4CDC8]">
                +
              </span>

              <span className="inline-block h-2 w-2 rounded-full bg-[#8C7CE8]" />

              그룹 스탬프 {data.groupStampCount}개
            </div>
          </section>

          {/* 스탬프 카드 */}
          <div className="flex gap-3">
            <StampGrid
              title="개인 스탬프"
              count={data.personalStampCount}
              emoji="🌱"
              color="mint"
            />

            <StampGrid
              title="그룹 스탬프"
              count={data.groupStampCount}
              emoji="👤"
              color="purple"
            />
          </div>

          {/* 오늘의 미션 */}
          <section className="rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(31,42,37,0.05)]">

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#2B3A33]">
                오늘의 미션
              </p>

              <p className="text-sm font-bold text-[#3BB985]">
                {completedMissionCount} / {missions.length} 완료
              </p>
            </div>

            <div className="space-y-3">
              {missions.length === 0 ? (
                <p className="py-3 text-center text-xs text-[#999]">
                  오늘의 미션이 없어요.
                </p>
              ) : (
                missions.map((mission) => (
                  <div
                    key={mission.missionId}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-medium text-[#2B3A33]">
                        {mission.title}
                      </p>

                      <p className="mt-0.5 text-xs text-[#999]">
                        {mission.description}
                      </p>
                    </div>

                    <span
                      className={
                        mission.status === "PASSED"
                          ? "text-lg text-[#3BB985]"
                          : "text-lg text-[#DDD]"
                      }
                    >
                      ✓
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 완성 리워드 */}
          {data.completed && (
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EFEBFB] to-[#E6EEFB] p-4">
              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#8C7CE8]">
                    W 정원 완성 리워드
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#3A3357]">
                    응모권과 맞춤 케어가 도착했어요!
                  </p>

                  <button
                    type="button"
                    className="mt-3 rounded-full bg-[#8C7CE8] px-4 py-2 text-xs font-semibold text-white"
                  >
                    완성 리워드 확인
                  </button>
                </div>

                <span className="shrink-0 text-5xl">
                  🎁
                </span>
              </div>
            </section>
          )}
        </main>

        {/* 하단 네비게이션 */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-sm justify-around border-t border-[#EEE] bg-white py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={
  item.href || `/fe-d/${id}/garden`
}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                item.label === "W 정원"
                  ? "font-bold text-[#3BB985]"
                  : "text-[#999]"
              }`}
            >
              <span className="text-lg">
                {item.emoji}
              </span>

              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}