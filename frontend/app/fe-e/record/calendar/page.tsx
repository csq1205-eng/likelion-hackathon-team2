'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";

// 개별 미션 상세 타입
interface MissionDetail {
  id: number;
  title: string;
  completed: boolean;
  type: 'walk' | 'water' | 'sleep' | 'general';
  isGroup?: boolean;
}

interface DayHistory {
  date: string;
  completedMissionCount: number;
  totalMissionCount: number;
  completed: boolean;
  personalCompleted?: boolean;
  groupCompleted?: boolean;
  missions?: MissionDetail[];
}

interface HistoryResponse {
  userId: number;
  year: number;
  month: number;
  days: DayHistory[];
}

interface StreakResponse {
  userId: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastCompletedDate: string;
}

// 더미 데이터
const FALLBACK_HISTORY: HistoryResponse = {
  userId: 1,
  year: 2026,
  month: 8,
  days: [
    { date: "2026-08-03", completedMissionCount: 2, totalMissionCount: 2, completed: true, personalCompleted: true, groupCompleted: false }, // 개인만 완료 -> 민트색 원
    { date: "2026-08-05", completedMissionCount: 2, totalMissionCount: 2, completed: true, personalCompleted: false, groupCompleted: true }, // 그룹만 완료 -> 보라색 원
    { date: "2026-08-10", completedMissionCount: 0, totalMissionCount: 3, completed: false, personalCompleted: false, groupCompleted: false }, // 미완료 -> 회색 원
    { 
      date: "2026-08-12", completedMissionCount: 3, totalMissionCount: 4, completed: false, personalCompleted: true, groupCompleted: true, // 둘다 완료(그룹 우선) -> 보라색 원
      missions: [
        { id: 101, title: '20분 걷기', completed: true, type: 'walk', isGroup: false },
        { id: 102, title: '물 2L 마시기', completed: true, type: 'water', isGroup: false },
        { id: 103, title: '다같이 하루 1만보 걷기', completed: true, type: 'general', isGroup: true },
        { id: 104, title: '밤 12시 전 취침', completed: false, type: 'sleep', isGroup: false }
      ]
    },
    { date: "2026-08-14", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: true, groupCompleted: false },
    { date: "2026-08-16", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: false, groupCompleted: true },
    { date: "2026-08-18", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: true, groupCompleted: false },
    { date: "2026-08-21", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: false, groupCompleted: true },
    { date: "2026-08-24", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: true, groupCompleted: false },
    { date: "2026-08-26", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: false, groupCompleted: true },
    { date: "2026-08-30", completedMissionCount: 3, totalMissionCount: 3, completed: true, personalCompleted: true, groupCompleted: true },
  ]
};

const FALLBACK_STREAK: StreakResponse = {
  userId: 1,
  currentStreakDays: 7,
  longestStreakDays: 14,
  lastCompletedDate: "2026-08-12"
};

type FilterType = 'ALL' | 'COMPLETED' | 'INCOMPLETE';

export default function MissionCalendarPage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();

  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(8);
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-12");
  const [filter, setFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setHistoryData(FALLBACK_HISTORY);
      setStreakData(FALLBACK_STREAK);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [streakRes, historyRes] = await Promise.all([
          fetch(`/api/v1/users/me/streak`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` } }), 
          fetch(`/api/v1/users/me/missions/history?year=${year}&month=${month}`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` } })
        ]);

        const streakResult = await streakRes.json();
        const historyResult = await historyRes.json();

        if (streakRes.ok && streakResult.success) setStreakData(streakResult.data);
        if (historyRes.ok && historyResult.success) setHistoryData(historyResult.data);
        else throw new Error('달력 데이터를 불러오지 못했습니다.');

      } catch (error) {
        console.error("API 연동 실패! 임시 데이터를 렌더링합니다:", error);
        setHistoryData(FALLBACK_HISTORY);
        setStreakData(FALLBACK_STREAK);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authLoading, accessToken, year, month]);

  const handlePrevMonth = () => {
    if (month === 1) { setYear(prev => prev - 1); setMonth(12); }
    else { setMonth(prev => prev - 1); }
  };

  const handleNextMonth = () => {
    if (month === 12) { setYear(prev => prev + 1); setMonth(1); }
    else { setMonth(prev => prev + 1); }
  };

  const generateCalendar = () => {
    if (!historyData) return [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, dateStr: '' });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = historyData.days.find(d => d.date === dateStr);
      days.push({ day: i, isCurrentMonth: true, dateStr, record });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, dateStr: '' });
    }
    return days;
  };

  const calendarDays = generateCalendar();
  const selectedDayInfo = historyData?.days.find(d => d.date === selectedDate);

  const filteredMissions = selectedDayInfo?.missions?.filter(mission => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return mission.completed;
    if (filter === 'INCOMPLETE') return !mission.completed;
    return true;
  });

  if (isLoading || !historyData) {
    return (
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#41C0A1] border-t-transparent rounded-full animate-spin mb-3"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 상단 헤더 */}
      <div className="flex items-center justify-center relative bg-white pt-6 pb-4 shrink-0">
        <button onClick={() => router.back()} 
          className="absolute left-5 text-[22px] font-bold text-[#A0A0A0]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="text-[18px] font-extrabold text-[#000000]">지난 미션</h1>
        <button className="absolute right-5 text-black">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16h6" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-2 pb-[100px] flex flex-col">
        
        {/* 월 이동 네비게이션 */}
        <div className="flex items-center justify-between px-2 mb-6 shrink-0">
          <button onClick={handlePrevMonth} className="p-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
          <span className="text-[17px] font-bold text-[#222222]">{year}년 {month}월</span>
          <button onClick={handleNextMonth} className="p-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>

        {/* 슬라이드 형식 필터 탭 */}
        <div className="flex bg-[#F9F9F9] rounded-full p-1 mb-8 shrink-0 relative">
          <button onClick={() => setFilter('ALL')} className={`flex-1 py-[8px] rounded-full text-[13px] font-bold transition-all duration-300 ${filter === 'ALL' ? 'bg-[#A7FBE7] text-[#222222] shadow-sm' : 'text-[#888888]'}`}>전체</button>
          <button onClick={() => setFilter('COMPLETED')} className={`flex-1 py-[8px] rounded-full text-[13px] font-bold transition-all duration-300 ${filter === 'COMPLETED' ? 'bg-[#A7FBE7] text-[#222222] shadow-sm' : 'text-[#888888]'}`}>완료</button>
          <button onClick={() => setFilter('INCOMPLETE')} className={`flex-1 py-[8px] rounded-full text-[13px] font-bold transition-all duration-300 ${filter === 'INCOMPLETE' ? 'bg-[#A7FBE7] text-[#222222] shadow-sm' : 'text-[#888888]'}`}>미완료</button>
        </div>

        {/* 달력 요일 헤더 */}
        <div className="grid grid-cols-7 text-center mb-5 shrink-0">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <span key={idx} className="text-[12px] font-medium text-[#888888]">{day}</span>
          ))}
        </div>

        {/* 동적 달력 그리드 */}
        <div className="grid grid-cols-7 gap-y-6 gap-x-1 shrink-0 mb-6">
          {calendarDays.map((item, index) => {
            const isSelected = item.dateStr === selectedDate;
            const hasRecord = !!item.record;
            
            // 필터링 적용 로직
            let isPersonalCompleted = item.record?.personalCompleted || false;
            let isGroupCompleted = item.record?.groupCompleted || false;
            let hasIncomplete = hasRecord && item.record!.completedMissionCount < item.record!.totalMissionCount;

            let showMintBg = false;
            let showPurpleBg = false;
            let showGrayBg = false;

            if (hasRecord) {
              if (filter === 'ALL') {
                if (isGroupCompleted) showPurpleBg = true;
                else if (isPersonalCompleted) showMintBg = true;
                else if (hasIncomplete) showGrayBg = true;
              } else if (filter === 'COMPLETED') {
                if (isGroupCompleted) showPurpleBg = true;
                else if (isPersonalCompleted) showMintBg = true;
              } else if (filter === 'INCOMPLETE') {
                if (hasIncomplete) showGrayBg = true;
              }
            }

            let circleClass = "w-[34px] h-[34px] rounded-full flex items-center justify-center text-[14px] font-medium transition-all mx-auto ";
            if (!item.isCurrentMonth) {
              circleClass += "text-[#D0D0D0] cursor-default";
            } else {
              circleClass += "text-[#333333] cursor-pointer ";
              
              if (isSelected) {
                circleClass += "border-[1.5px] border-[#41C0A1] ";
              }
              
              if (showPurpleBg) circleClass += "bg-[#EADDFF]";
              else if (showMintBg) circleClass += "bg-[#A7FBE7]";
              else if (showGrayBg) circleClass += "bg-[#F5F5F5]";
              else if (isSelected) circleClass += "bg-white";
            }

            return (
              <div key={index} className="flex flex-col items-center justify-center" onClick={() => item.isCurrentMonth && setSelectedDate(item.dateStr)}>
                <div className={circleClass}>
                  {item.day}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 범례 */}
        <div className="flex items-center justify-center gap-5 mt-2 mb-8 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-[12px] h-[12px] rounded-full bg-[#A7FBE7]"></span>
            <span className="text-[12px] font-medium text-[#888888]">개인 완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[12px] h-[12px] rounded-full bg-[#EADDFF]"></span>
            <span className="text-[12px] font-medium text-[#888888]">그룹 완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[12px] h-[12px] rounded-full bg-[#F5F5F5]"></span>
            <span className="text-[12px] font-medium text-[#888888]">미완료</span>
          </div>
        </div>

        {/* 하단 상세 내역 카드 */}
        <div className="bg-[#F9F9F9] rounded-[24px] p-5 flex flex-col shrink-0 mt-auto">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[16px] font-bold text-[#222222]">
              {selectedDate ? `${month}월 ${parseInt(selectedDate.split('-')[2])}일` : '날짜를 선택해주세요'}
            </span>
            {selectedDayInfo && (
              <span className="text-[13px] font-bold text-[#41C0A1]">
                {selectedDayInfo.completedMissionCount} / {selectedDayInfo.totalMissionCount} 완료
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            {filteredMissions && filteredMissions.length > 0 ? (
              filteredMissions.map((mission) => (
                <div 
                  key={mission.id} 
                  onClick={() => router.push(`/fe-e/record/detail/${mission.id}`)}
                  className="flex items-center justify-between py-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#222222] ${mission.completed ? (mission.isGroup ? 'bg-[#F3EDFF]' : 'bg-[#E5F7F1]') : 'bg-gray-200 text-gray-500'}`}>
                      {mission.type === 'walk' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M14 8l-2-2-2 2v6l-2 2"/><path d="M12 14l2 2v6"/></svg>
                      ) : mission.type === 'water' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[15px] font-bold transition-colors ${mission.completed ? 'text-[#222222]' : 'text-[#888888] group-hover:text-gray-500'}`}>
                          {mission.title}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {mission.completed && (
                    <svg 
                      width="22" 
                      height="22" 
                      viewBox="0 0 24 24" 
                      fill={mission.isGroup ? "#B39DDB" : "#41C0A1"}
                    >
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.824 7.653-7.568-1.06-1.06-6.593 6.513z"/>
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[13px] text-[#999999] py-4 text-center">조건에 맞는 미션이 없습니다.</p>
            )}
          </div>
        </div>

      </div>

      {/* 하단 탭바 */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
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
      {icon === 'check' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
      {icon === 'leaf' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
      {icon === 'bar-chart' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z" /></svg>}
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}