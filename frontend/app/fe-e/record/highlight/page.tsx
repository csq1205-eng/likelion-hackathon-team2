'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";

interface HighlightItem {
  id: number;
  date: string;
  current: number;
  total: number;
  time: string;
  theme: string;
}

interface HighlightArchiveResponse {
  year: number;
  month: number;
  highlights: HighlightItem[];
}

const FALLBACK_HIGHLIGHTS: HighlightArchiveResponse = {
  year: 2026,
  month: 8,
  highlights: [
    { id: 1, date: '8월 12일 (수)', current: 9, total: 21, time: '00:30', theme: 'mountain' },
    { id: 2, date: '8월 11일 (화)', current: 7, total: 21, time: '00:30', theme: 'bunting' },
    { id: 3, date: '8월 10일 (월)', current: 11, total: 21, time: '00:30', theme: 'leaf' },
    { id: 4, date: '8월 9일 (일)', current: 6, total: 21, time: '00:30', theme: 'balloon' },
    { id: 5, date: '8월 8일 (토)', current: 10, total: 21, time: '00:30', theme: 'star' },
  ]
};

export default function HighlightArchivePage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  
  const [archiveData, setArchiveData] = useState<HighlightArchiveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setArchiveData(FALLBACK_HIGHLIGHTS);
      setIsLoading(false);
      return;
    }

    const fetchHighlights = async () => {
      try {
        // 13.3 하이라이트 모아보기 API 
        const response = await fetch(`/api/v1/users/{userId}/highlights?year=2026&month=8`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setArchiveData(result.data);
        } else {
          throw new Error('하이라이트 목록을 불러오지 못했습니다.');
        }
      } catch (error) {
        console.error("하이라이트 조회 실패! 임시 데이터를 렌더링합니다:", error);
        setArchiveData(FALLBACK_HIGHLIGHTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlights();
  }, [authLoading, accessToken]);

  if (isLoading || !archiveData) {
    return (
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#41C0A1] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-[#999]">하이라이트를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[#F9F9F9] flex flex-col overflow-hidden">
      
      {/* 상단 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-center shrink-0 shadow-sm z-10 relative">
        <button onClick={() => router.back()} className="absolute left-5 text-[22px] font-bold text-[#A0A0A0]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-[18px] font-extrabold text-[#000000]">하이라이트</h1>
        <button className="absolute right-5 text-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </button>
      </div>

      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 py-6 pb-[90px] flex flex-col gap-[10px]">
        
        {/* 월 이동 네비게이션 */}
        <div className="flex items-center justify-between px-2 bg-white py-3 rounded-[20px] shadow-sm">
          <button className="p-1 text-gray-400 hover:text-black"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
          <span className="text-[15px] font-extrabold text-[#222222]">{archiveData.year}년 {archiveData.month}월</span>
          <button className="p-1 text-gray-400 hover:text-black"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>

        {/* 필터 탭 */}
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
          <button className="flex-1 py-[10px] bg-[#41C0A1] text-white rounded-full text-[13px] font-extrabold shadow-sm">전체</button>
          <button className="flex-1 py-[10px] text-[13px] font-bold text-[#666666] hover:text-black">이번 주</button>
          <button className="flex-1 py-[10px] text-[13px] font-bold text-[#666666] hover:text-black">완주</button>
        </div>

        {/* 이번 주 대표 카드 */}
        <div className="bg-gradient-to-r from-[#F0FCF9] to-[#E2F7F2] rounded-[24px] p-5 flex flex-row items-center justify-between shadow-sm border border-[#D1F2E8]">
          <div className="flex flex-col">
            <h2 className="text-[16px] font-extrabold text-[#222222]">이번 주 우리의 하루</h2>
            <p className="text-[12px] text-[#555555] font-medium mt-0.5 mb-3">8. 6 - 8. 12</p>
            
            <div className="flex items-center gap-1.5 text-[#41C0A1] font-bold text-[13px] mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              00:30
            </div>

            <div className="flex gap-2">
              <div className="bg-white/80 text-[#41C0A1] text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs">
                공유 클립 6
              </div>
              <div className="bg-white/80 text-[#8B6DF8] text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs">
                완료 카드 9
              </div>
            </div>
          </div>

          <div className="w-[110px] h-[85px] bg-[#A5E3D0]/30 rounded-[16px] relative overflow-hidden shrink-0 flex items-center justify-center border border-white/50 shadow-inner">
             <span className="text-[12px] font-bold text-[#41C0A1]">대표 영상</span>
          </div>
        </div>

        {/* 날짜별 하이라이트 리스트 */}
        <div className="flex flex-col">
          <h3 className="text-[16px] font-extrabold text-[#222222] mt-[14px] mb-3">날짜별 하이라이트</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {archiveData.highlights.map((item) => (
              <div key={item.id} className="bg-white rounded-[20px] p-3 shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="w-full aspect-[16/10] bg-[#F4FBF9] rounded-[14px] relative flex items-center justify-center overflow-hidden">
                  <svg className="absolute top-2.5 left-2.5 w-4 h-4 text-[#41C0A1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-400 font-medium">썸네일</span>
                </div>
                
                <div className="flex flex-col px-1">
                  <span className="text-[13px] font-bold text-[#222222]">{item.date}</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 mt-0.5">
                    <span className="text-[#41C0A1] font-bold">{item.current} / {item.total}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* 잠긴 하이라이트 아이템 */}
            <div className="bg-white rounded-[20px] p-3 shadow-sm border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 aspect-[16/11]">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                🔒
              </div>
              <span className="text-[11px] text-[#666666] font-bold text-center leading-snug mt-1">
                미션 완료 후<br/>하이라이트가 생겨요
              </span>
            </div>
          </div>
        </div>

        {/* 하단 안내 배너 */}
        <div className="bg-white rounded-[20px] p-4 flex items-center gap-3 shadow-sm border border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#EAF9F4] flex items-center justify-center text-[#41C0A1] shrink-0 font-bold">
            i
          </div>
          <p className="text-[12px] text-[#666666] font-medium leading-relaxed">
            공유 멤버의 클립만 영상에 담고,<br />비공유 멤버는 완료 카드로 보여요.
          </p>
        </div>

      </div>

      {/* 하단 탭 바 (4개 탭 통일) */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-6 pt-3 pb-5 z-50">
        <TabIcon icon="users" label="그룹" onClick={() => router.push('/fe-e/group')} />
        <TabIcon icon="check" label="미션" onClick={() => router.push('/fe-d/mission')} />
        <TabIcon icon="leaf" label="W 정원" onClick={() => router.push('/fe-d/[id]/garden')} />
        <TabIcon icon="bar-chart" label="기록" isActive onClick={() => router.push('/fe-e/record/report')} />
      </div>
    </div>
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