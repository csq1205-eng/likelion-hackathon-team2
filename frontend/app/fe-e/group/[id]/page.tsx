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
        const groupData = await apiRequest<GroupDetailResponse>(`/groups/${groupId}/highlight`, {
          accessToken, 
        });

        setGroupDetail(prev => ({
          ...FALLBACK_GROUP_DETAIL,
          ...groupData
        }));

        const missionRes = await getTodayMissions(accessToken);
        if (missionRes && missionRes.missions && missionRes.missions.length > 0) {
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
      router.push(`/fe-d/mission`);
    }
  };

  if (isLoading || !groupDetail) {
    return (
      <main className="w-full min-h-[100dvh] bg-[#F7F8F8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="w-full h-[100dvh] bg-[#F7F8F8] sm:px-4 sm:py-6 flex items-center justify-center sm:overflow-hidden">
      <div className="mx-auto flex w-full h-full sm:h-[740px] max-w-none sm:max-w-sm flex-col bg-white sm:rounded-3xl sm:shadow-[0_8px_30px_rgba(31,42,37,0.06)] overflow-hidden relative justify-between">
        
        {/* 상단 헤더 */}
        <div className="bg-white px-6 py-5 flex items-center shrink-0 z-10">
          <button onClick={() => router.back()} className="text-[22px] font-bold text-[#A0A0A0] mr-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[18px] font-bold text-[#000000]">
            {groupDetail.name || "그룹 피드"}
          </h1>
          <button 
            onClick={() => router.push(`/fe-e/group/${groupId}/status`)}
            className="ml-auto text-[13px] font-bold text-[#41C0A1] bg-[#EAF9F4] px-4 py-2 rounded-full hover:bg-[#d4f2e9] transition-colors"
          >
            현황 보기
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 py-6 flex flex-col gap-8">
           
          <div className="bg-[#F9F9F9] rounded-[20px] p-5 shadow-sm">
            <h2 className="text-[13px] text-[#41C0A1] font-bold mb-1.5">오늘의 미션</h2>
            <p className="text-[17px] font-bold text-[#222222] mb-5 leading-tight">
              {todayMissionObj?.title || groupDetail.todayMission || "오늘의 미션이 등록되지 않았습니다."}
            </p>
            <button 
              onClick={handleMissionAuth}
              className="w-full py-3 bg-[#222222] text-white font-bold rounded-[14px] text-[15px] hover:bg-black transition-colors"
            >
              미션 인증하기
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[16px] font-bold text-[#222222]">{groupDetail.title}</h3>
              <span className="text-[12px] text-[#888] font-medium">{groupDetail.highlightDate}</span>
            </div>
            <div className="w-full h-[220px] bg-gray-200 rounded-[20px] flex items-center justify-center relative overflow-hidden shadow-sm">
              {groupDetail.videoUrl ? (
                <video src={groupDetail.videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 font-medium">생성된 하이라이트 영상이 없어요</span>
              )}
              
              <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10">
                <p className="text-white font-semibold text-[14px] leading-snug drop-shadow-sm">
                  {groupDetail.summary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 탭 바 */}
        <div className="bg-white border-t border-gray-100 flex justify-between items-center px-6 pt-3 pb-5 z-50 shrink-0">
          <TabIcon icon="users" label="그룹" isActive onClick={() => router.push('/fe-e/group')} />
          <TabIcon icon="check" label="미션" onClick={() => router.push('/fe-d/mission')} />
          <TabIcon icon="leaf" label="W 정원" onClick={() => router.push(`/fe-d/${groupId}/garden`)} />
          <TabIcon icon="bar-chart" label="기록" onClick={() => router.push('/fe-e/record/report')} />
        </div>

      </div>
    </main>
  );
}

function TabIcon({ icon, label, isActive = false, onClick }: { icon: string, label: string, isActive?: boolean, onClick?: () => void }) {
  const colorClass = isActive ? "text-[#41C0A1]" : "text-[#BDBDBD]";
  return (
    <div onClick={onClick} className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}>
      {icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
      {icon === 'check' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
      {icon === 'leaf' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
      {icon === 'bar-chart' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z"/></svg>}
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}