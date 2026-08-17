'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setGroupDetail(FALLBACK_GROUP_DETAIL);
      setIsLoading(false);
      return;
    }

    const fetchGroupDetail = async () => {
      try {
        const response = await fetch(`/api/v1/groups/${groupId}/highlight`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}` 
          },
        });

        const result = await response.json();

        if (response.ok) {
          setGroupDetail(prev => ({
            ...FALLBACK_GROUP_DETAIL,
            ...(result.data || result)
          }));
        } else {
          throw new Error(result.message || '그룹 정보를 불러오지 못했습니다.');
        }

      } catch (error) {
        console.error("그룹 피드 조회 실패! 임시 데이터를 렌더링합니다:", error);
        setGroupDetail(FALLBACK_GROUP_DETAIL); 
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetail();
    }

  }, [groupId, authLoading, accessToken]);

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
            className="absolute top-[21px] text-[22px] font-bold text-black">
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
            {groupDetail.todayMission || "오늘의 미션이 등록되지 않았습니다."}
          </p>
          <button 
            onClick={() => router.push('/fe-d/mission/camera')}
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