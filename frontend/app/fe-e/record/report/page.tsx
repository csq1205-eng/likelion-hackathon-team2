'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";

interface WeeklyReportResponse {
  startDate: string;
  endDate: string;
  totalCompleted: number;
  achievementRate: number;
  completedCount: number;
  totalCount: number;
  failedCount?: number;
  unsubmittedCount?: number;
  bestHabit: { name: string; successDays: number };
  aiSummary: string;
  weeklyData: { day: string; count: number }[];
  currentStreakDays: number;
  longestStreakDays: number;
}

// 더미 데이터
const FALLBACK_REPORT: WeeklyReportResponse = {
  startDate: "8. 6",
  endDate: "8. 12",
  totalCompleted: 18,
  achievementRate: 86,
  completedCount: 18,
  totalCount: 21,
  bestHabit: { name: "물 2L 마시기", successDays: 5 },
  aiSummary: "규칙적인 수면과 수분 섭취 습관이 이번 주 성과의 비결이에요! 주말에도 꾸준했던 점이 아주 훌륭합니다.",
  weeklyData: [
    { day: '목', count: 1 },
    { day: '금', count: 2 },
    { day: '토', count: 4 },
    { day: '일', count: 3 },
    { day: '월', count: 2 },
    { day: '화', count: 4 },
    { day: '수', count: 2 },
  ],
  currentStreakDays: 7,
  longestStreakDays: 14,
};

export default function WeeklyReportPage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();

  const [reportData, setReportData] = useState<WeeklyReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setReportData(FALLBACK_REPORT);
      setIsLoading(false);
      return;
    }

    const fetchReportData = async () => {
      try {
        // 개인별 통합 주간 리포트 API
        const response = await fetch(`/api/v1/users/me/weekly-report-data`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          setReportData(result.data);
        } else {
          throw new Error('주간 리포트 데이터를 불러오지 못했습니다.');
        }

      } catch (error) {
        console.error("리포트 조회 실패! 임시 데이터를 렌더링합니다:", error);
        setReportData(FALLBACK_REPORT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [authLoading, accessToken]);

  const handleGardenClick = () => {
    const savedGroupId = typeof window !== 'undefined' ? localStorage.getItem('myGroupId') || '1' : '1';
    router.push(`/fe-d/${savedGroupId}/garden`);
  };

  if (isLoading || !reportData) {
    return (
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#41C0A1] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-[#999]">이번 주 리포트를 불러오는 중...</p>
      </div>
    );
  }

  const maxCount = reportData.weeklyData?.length > 0 
    ? Math.max(...reportData.weeklyData.map(d => d.count)) 
    : 1;

  return (
    <div className="relative w-full h-[100dvh] bg-[#F9F9F9] flex flex-col overflow-hidden">
      
      {/* 상단 헤더 */}
      <div className="flex items-center justify-center relative bg-white pt-6 pb-4 shrink-0 shadow-sm z-10">
        <button onClick={() => router.back()} className="absolute left-5 text-[22px] font-bold text-[#A0A0A0] hover:opacity-70 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[18px] font-extrabold text-[#000000]">이번 주 리포트</h1>
          <p className="text-[12px] text-[#888888] font-medium mt-0.5">{reportData.startDate} - {reportData.endDate}</p>
        </div>
      </div>

      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-5 pb-[100px] flex flex-col gap-4">
        
        {/* 주간 요약 & 차트 */}
        <div className="bg-white rounded-[24px] p-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col shrink-0">
          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#666666]">이번 주 완료 미션</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[36px] font-extrabold text-[#41C0A1] tracking-tight leading-none">{reportData.totalCompleted}</span>
                <span className="text-[20px] font-bold text-[#222222]">개</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] bg-[#E5F7F1] rounded-full flex items-center justify-center text-[#41C0A1]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>

          {/* 막대 차트 */}
          <div className="flex justify-between items-end h-[110px]">
            {reportData.weeklyData?.map((data, index) => {
              const isMax = data.count === maxCount && data.count > 0;
              const heightPercentage = data.count === 0 ? 0 : (data.count / maxCount) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <span className={`text-[12px] font-bold transition-colors ${isMax ? 'text-[#41C0A1]' : 'text-[#A0A0A0]'}`}>
                    {data.count > 0 ? data.count : ''}
                  </span>
                  <div className="w-full h-[70px] flex items-end justify-center">
                    {data.count > 0 ? (
                      <div 
                        className={`w-[14px] rounded-full transition-all duration-500 ease-out ${isMax ? 'bg-[#41C0A1] shadow-sm' : 'bg-[#E5F7F1]'}`} 
                        style={{ height: `${heightPercentage}%` }} 
                      />
                    ) : (
                      <div className="w-[14px] h-[4px] rounded-full bg-[#F0F0F0]" />
                    )}
                  </div>
                  <span className={`text-[12px] font-bold ${isMax ? 'text-[#222222]' : 'text-[#888888]'}`}>{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI 한줄 리포트 */}
        <div className="bg-gradient-to-r from-[#F0FCF9] to-[#F4FBF9] rounded-[24px] p-5 border border-[#E2F7F2] shadow-sm shrink-0 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#41C0A1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span className="text-[14px] font-extrabold text-[#41C0A1]">AI 리포트</span>
          </div>
          <p className="text-[11.5px] text-[#555555] font-medium leading-relaxed">
            {reportData.aiSummary}
          </p>
        </div>

        {/* 2단 그리드 카드 (달성률 & 최고 습관) */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          
          {/* 달성률 */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center">
            <span className="text-[14px] font-bold text-[#666666] w-full mb-3">달성률</span>
            
            <div className="relative w-[85px] h-[85px] flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 overflow-visible">
                <path className="text-[#F0F0F0]" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-[#41C0A1]" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={`${reportData.achievementRate}, 100`} stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center mt-1">
                <span className="text-[20px] font-extrabold text-[#222222] leading-none">{reportData.achievementRate}<span className="text-[12px] font-bold ml-[1px]">%</span></span>
              </div>
            </div>
            <span className="text-[14px] text-center font-bold text-[#A0A0A0] mt-3 bg-[#F5F5F5] px-[10px] py-1 rounded-[12px]">
              {reportData.completedCount} / {reportData.totalCount} 완료
            </span>
          </div>

          {/* 최고 기록 및 연속 달성 병합 카드 */}
          <div className="flex flex-col gap-3">
            {/* 베스트 습관 */}
            <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col flex-1 justify-center">
              <span className="text-[13px] font-bold text-[#666666] mb-1">베스트 습관</span>
              <span className="text-[15px] font-extrabold text-[#222222] truncate">{reportData.bestHabit?.name || '정보 없음'}</span>
              <span className="text-[13px] font-bold text-[#41C0A1] mt-1">{reportData.bestHabit?.successDays || 0}일 성공</span>
            </div>
            
            {/* 연속 달성 */}
            <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col flex-1 justify-center relative overflow-hidden">
              <span className="text-[13px] font-bold text-[#666666] mb-1 z-10">연속 달성</span>
              <div className="flex items-baseline gap-1 z-10">
                <span className="text-[24px] font-extrabold text-[#41C0A1] leading-none">{reportData.currentStreakDays}</span>
                <span className="text-[14px] font-bold text-[#222222]">일째</span>
              </div>
              <span className="text-[11px] text-[#A0A0A0] font-medium mt-1 z-10">최고기록 {reportData.longestStreakDays}일</span>
              
              <div className="absolute right-[-15px] bottom-[-15px] text-[#F9F9F9]">
                <svg width="70" height="70" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 8H21L16.5 12.5L18 19L12 15.5L6 19L7.5 12.5L3 8H9L12 2Z"/></svg>
              </div>
            </div>
          </div>

        </div>

        {/* 하단 배너 및 버튼 */}
        <div className="shrink-0">
          <div className="bg-[#F3EDFF] rounded-[20px] p-[16px] flex flex-row items-center gap-4 shadow-sm border border-[#EADDFF]">
            <div className="w-[44px] h-[44px] shrink-0 bg-white rounded-[14px] flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-[#7E6CD3]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-[#7E6CD3]">계속해서 기록이 쌓이고 있어요!</span>
              <span className="text-[11px] text-[#666666] font-medium mt-0.5 leading-snug">꾸준한 행동 기록은 맞춤 케어의 비결이에요.</span>
            </div>
          </div>

          <button 
            onClick={() => router.push('/fe-e/record/calendar')}
            className="w-full py-4 mt-[14px] rounded-[15px] border-[1.5px] border-[#41C0A1] text-[#41C0A1] font-extrabold text-[15px] bg-[#F7F7F7] hover:bg-[#F0FDF8] transition-colors shadow-sm"
          >
            지난 미션 보기
          </button>
        </div>

      </div>

      {/* 하단 탭바 */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
        <TabIcon icon="users" label="그룹" onClick={() => router.push('/fe-e/group')} />
        <TabIcon icon="check" label="미션" onClick={() => router.push('/fe-d/mission')} />
        <TabIcon icon="leaf" label="W 정원" onClick={handleGardenClick} />
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