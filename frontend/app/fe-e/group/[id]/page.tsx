'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from '@/lib/api/client';
import { getTodayMissions, type Mission } from '@/lib/api/mission';

interface GroupDetailResponse {
  groupId: number;
  name?: string;          
  todayMission?: string;  
  highlightId: number;
  highlightDate: string;
  title: string;
  videoUrl: string | null;
  summary: string;
}

const FALLBACK_GROUP_DETAIL: GroupDetailResponse = {
  groupId: 10,
  name: "내 친구들",
  todayMission: "아침에 일어나서 물 한 잔 마시기",
  highlightId: 500,
  highlightDate: "2026-08-16",
  title: "오늘의 하이라이트",
  videoUrl: null,
  summary: "오늘 그룹원 4명 중 3명이 루틴을 완료했습니다.",
};

export default function GroupMainFeedPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string; 

  const { accessToken, isLoading: authLoading } = useAuth();
  
  const [groupDetail, setGroupDetail] = useState<GroupDetailResponse | null>(null);
  const [todayMissionObj, setTodayMissionObj] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setGroupDetail(FALLBACK_GROUP_DETAIL);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!accessToken) return;

      try {
        // 그룹 하이라이트/상세 정보 조회
        const groupData = await apiRequest<GroupDetailResponse>(`/groups/${groupId}/highlight`, {
          accessToken, 
        });

        setGroupDetail(prev => ({
          ...FALLBACK_GROUP_DETAIL,
          ...groupData
        }));

        // 오늘의 미션 목록을 조회하여 실제 missionId가 포함된 미션 객체 획득
        const missionRes = await getTodayMissions(accessToken);
        if (missionRes && missionRes.missions && missionRes.missions.length > 0) {
          // 첫 번째 미션을 오늘의 미션으로 매칭하거나 타이틀이 일치하는 미션 탐색
          const matchedMission = missionRes.missions[0];
          setTodayMissionObj(matchedMission);
        }

      } catch (error) {
        console.error("그룹 피드 및 미션 조회 실패! 임시 데이터를 렌더링합니다:", error);
        setGroupDetail(FALLBACK_GROUP_DETAIL); 
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchData();
    }

  }, [groupId, authLoading, accessToken]);

  const handleMissionAuth = () => {
    if (todayMissionObj && todayMissionObj.missionId) {
      router.push(`/fe-d/mission/camera?missionId=${todayMissionObj.missionId}`);
    } else {
      // 미션 정보가 없을 경우 미션 목록 화면으로 유도
      router.push(`/fe-d/mission`);
    }
  };

  if (isLoading || !groupDetail) {
    return (
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-[#F9F9F9]">
        <div className="w-8 h-8 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-[#999]">그룹 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[100dvh] relative bg-[#F9F9F9] overflow-hidden">
      
      {/* 상단 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center shrink-0 z-10 shadow-sm">
        <button onClick={() => router.back()} 
            className="absolute top-[21px] text-[22px] font-bold text-[#A0A0A0]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        <h1 className="text-[18px] font-bold text-[#000000] ml-[32px] mt-[4px]">
          {groupDetail.name || "그룹 피드"}
        </h1>
        <button 
          onClick={() => router.push(`/fe-e/group/${groupId}/status`)}
          className="ml-auto text-[13px] font-bold text-[#41C0A1] bg-[#EAF9F4] px-3 py-1.5 rounded-full hover:bg-[#d4f2e9] transition-colors"
        >
          현황 보기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 py-6 flex flex-col gap-6">
         
        {/* 오늘의 미션 영역 */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm">
          <h2 className="text-[13px] text-[#41C0A1] font-bold mb-1">오늘의 미션</h2>
          <p className="text-[18px] font-bold text-[#222222] mb-5">
            {todayMissionObj?.title || groupDetail.todayMission || "오늘의 미션이 등록되지 않았습니다."}
          </p>
          <button 
            onClick={handleMissionAuth}
            className="w-full py-3 bg-[#222222] text-white font-bold rounded-[12px] text-[15px] hover:bg-black transition-colors"
          >
            미션 인증하기
          </button>
        </div>

        {/* 멤버들의 클립 피드 및 하이라이트 영역 */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[16px] font-bold text-[#222222]">{groupDetail.title}</h3>
            <span className="text-[12px] text-[#888] font-medium">{groupDetail.highlightDate}</span>
          </div>

          <div className="w-full h-[220px] bg-gray-200 rounded-[16px] flex items-center justify-center relative overflow-hidden shadow-sm">
            {groupDetail.videoUrl ? (
              <video src={groupDetail.videoUrl} controls className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 font-medium">생성된 하이라이트 영상이 없어요</span>
            )}
            
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10">
              <p className="text-white font-semibold text-[14px] leading-snug drop-shadow-sm">
                {groupDetail.summary}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}