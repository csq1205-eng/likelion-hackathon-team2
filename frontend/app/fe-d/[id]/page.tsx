"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getMyGroups, type GroupSummaryResponse } from "@/lib/api/group";

const GROUP_THEMES = [
  { bg: "bg-[#A7FBE7]", text: "text-[#000000]" },
  { bg: "bg-[#9884D2]", text: "text-[#FFFFFF]" },
  { bg: "bg-[#FFB74D]", text: "text-[#FFFFFF]" },
  { bg: "bg-[#64B5F6]", text: "text-[#FFFFFF]" },
  { bg: "bg-[#50C2A4]", text: "text-[#FFFFFF]" },
];

export default function GroupListJoin() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();

  const [myGroups, setMyGroups] = useState<GroupSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !accessToken) return;

    getMyGroups(accessToken)
      .then((res) => {
        setMyGroups(res.groups);
      })
      .catch((err) => {
        console.error("그룹 목록 조회 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, accessToken]);

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full items-center justify-center bg-white">
        <p className="text-sm text-[#999]">그룹을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6">
      <h3 className="text-[15px] text-[#666666] font-semibold mt-2">
        내 그룹
      </h3>

      <h1 className="text-[18px] text-[#000000] font-bold mt-2 mb-6">
        함께하는 그룹
      </h1>

      <div className="space-y-3 flex-1 overflow-y-auto pb-[30px]">
        {myGroups.map((group, index) => {
          const theme = GROUP_THEMES[index % GROUP_THEMES.length];

          return (
            <div
              key={group.groupId}
              onClick={() => router.push(`/fe-e/group/${group.groupId}`)}
              className="bg-[#F9F9F9] p-4 rounded-[20px] flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[16px] shrink-0 ${theme.bg} ${theme.text}`}
              >
                {group.name.charAt(0)}
              </div>

              <div className="flex-1 ml-[12px] flex flex-col justify-center">
                <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {group.name}
                </h2>

                <p className="text-[11px] text-[#666666] font-semibold mt-[2px] mb-[2px]">
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
          onClick={() => router.push("/fe-e/group/invite/[id]")}
          className="w-full py-3 rounded-[12px] text-[#9CA3AF] font-semibold text-[14px] border-dashed border-[1.2px] border-[#8B9A95] hover:bg-gray-50 transition-colors flex justify-center items-center"
        >
          + 새 그룹 만들기 / 참여하기
        </button>
      </div>
    </div>
  );
}