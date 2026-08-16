"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

interface GroupSummaryResponse {
  groupId: string;
  name: string;
  todayCompletedCount: number;
  todayTotalCount: number;
  progressRate: number;
}

const GROUP_THEMES = [
  { bg: "bg-[#A7FBE7]", text: "text-[#000000]" },
  { bg: "bg-[#9884D2]", text: "text-[#FFFFFF]" },
  { bg: "bg-[#FFB74D]", text: "text-[#FFFFFF]" },
  { bg: "bg-[#64B5F6]", text: "text-[#FFFFFF]" },
  { bg: "bg-[#50C2A4]", text: "text-[#FFFFFF]" },
];

// 임시 데이터
const FALLBACK_GROUPS = [
  {
    groupId: "g1",
    name: "내 친구들",
    todayCompletedCount: 2,
    todayTotalCount: 4,
    progressRate: 50,
  },
  {
    groupId: "g2",
    name: "대학 동기들",
    todayCompletedCount: 4,
    todayTotalCount: 5,
    progressRate: 80,
  },
];

export default function GroupListJoin() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();

  const [myGroups, setMyGroups] = useState<GroupSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 정보 로딩 중 : 잠시 대기
    if (authLoading) return;

    // 토큰이 없는 경우 (비로그인 상태 등) API 호출 없이 가짜 데이터 렌더링
    if (!accessToken) {
      console.warn("엑세스 토큰이 없습니다. 개발용 임시 데이터를 렌더링합니다.");
      setMyGroups(FALLBACK_GROUPS);
      setLoading(false);
      return;
    }

    // 정상적인 API 호출 시도
    const fetchMyGroups = async () => {
      try {
        const response = await fetch('/api/v1/groups', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}` 
          },
        });

        const result = await response.json();

        if (response.ok) {
                setMyGroups(result.groups || result.data || []);
        } else {
          throw new Error(result.message || '응답이 정상이 아닙니다.');
        }

      } catch (error) {
        // 통신 실패 시 가짜 데이터 렌더링
        console.error("그룹 목록 조회 실패! 임시 데이터를 렌더링합니다:", error);
        setMyGroups(FALLBACK_GROUPS);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGroups();

  }, [authLoading, accessToken]);

    if (loading) {
      return (
        <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[#999]">그룹을 불러오는 중...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full h-[100dvh] relative bg-white overflow-hidden">
              
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-6 pb-[90px]">
          <h3 className="text-[15px] text-[#666666] font-semibold mt-2">
            내 그룹
          </h3>

          <h1 className="text-[18px] text-[#000000] font-bold mt-2 mb-6">
            함께하는 그룹
          </h1>

          <div className="space-y-3">
            {myGroups.map((group, index) => {
              const theme = GROUP_THEMES[index % GROUP_THEMES.length];

                return (
                  <div
                    key={group.groupId}
                    onClick={() => router.push(`/fe-e/group/${group.groupId}`)}
                    className="bg-[#F9F9F9] p-4 rounded-[20px] flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[18px] shrink-0 ${theme.bg} ${theme.text}`}
                    >
                      {group.name.charAt(0)}
                    </div>

                    <div className="flex-1 ml-[12px] flex flex-col justify-center">
                      <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                        {group.name}
                      </h2>

                      <p className="text-[11px] text-[#888888] font-semibold mt-[2px] mb-[2px]">
                        오늘 {group.todayCompletedCount}/{group.todayTotalCount}명 완료
                      </p>

                      <div className="w-[70%] bg-gray-200 rounded-full h-1.5 mt-[1px]">
                        <div
                          className={`h-full ${theme.bg} rounded-full transition-all duration-500`}
                          style={{
                            width: `${group.progressRate}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-gray-400 shrink-0 ml-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}

              {myGroups.length === 0 && (
                <p className="text-center text-sm text-[#999] py-10">
                  참여 중인 그룹이 없어요.
                </p>
              )}

          <button
            onClick={() => router.push("/fe-e/group/invite/test-group-123")}
            className="w-full py-3 mt-2 rounded-xl text-[#8B9A95] font-semibold text-[14px] border-dashed border-[1.2px] border-[#8B9A95] hover:bg-gray-50 transition-colors flex justify-center items-center"
          >
            + 새 그룹 만들기 / 참여하기
          </button>
        </div>
      </div>

      {/* 하단 탭바 */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
        <TabIcon
          icon="users"
          label="그룹"
          isActive
          onClick={() => router.push('/fe-e/group')}
        />

        <TabIcon
          icon="check"
          label="미션"
          onClick={() => router.push('/fe-e/mission')}
        />

        <TabIcon
          icon="leaf"
          label="W 정원"
          onClick={() => router.push('/fe-e/garden')}
        />

        <TabIcon
          icon="bar-chart"
          label="기록"
          onClick={() => router.push('/fe-e/record/report')}
        />
      </div>
    </div>
  );
}

function TabIcon({
  icon,
  label,
  isActive = false,
  onClick,
}: {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const colorClass = isActive
    ? 'text-[#41C0A1]'
    : 'text-[#BDBDBD]';

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}
    >
      {icon === 'users' && (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}

      {icon === 'check' && (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      )}

      {icon === 'leaf' && (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      )}

      {icon === 'bar-chart' && (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z" />
        </svg>
      )}

      <span className="text-[10px] font-bold">
        {label}
      </span>
    </div>
  );
}