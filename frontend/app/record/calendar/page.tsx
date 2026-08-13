'use client';

import { useRouter } from 'next/navigation';

export default function MissionCalendarPage() {
  const router = useRouter();

  // 💡 달력 데이터 (시안과 완벽하게 동일한 2026년 8월 기준 데이터)
  const calendarData = [
    // 1주차
    { day: 26, isCurrent: false, type: 'none' }, { day: 27, isCurrent: false, type: 'none' }, { day: 28, isCurrent: false, type: 'none' }, { day: 29, isCurrent: false, type: 'none' }, { day: 30, isCurrent: false, type: 'none' }, { day: 31, isCurrent: false, type: 'none' }, { day: 1, isCurrent: true, type: 'incomplete' },
    // 2주차
    { day: 2, isCurrent: true, type: 'incomplete' }, { day: 3, isCurrent: true, type: 'personal-group' }, { day: 4, isCurrent: true, type: 'incomplete' }, { day: 5, isCurrent: true, type: 'personal-group' }, { day: 6, isCurrent: true, type: 'incomplete' }, { day: 7, isCurrent: true, type: 'incomplete' }, { day: 8, isCurrent: true, type: 'incomplete' },
    // 3주차
    { day: 9, isCurrent: true, type: 'group-only' }, { day: 10, isCurrent: true, type: 'personal-group' }, { day: 11, isCurrent: true, type: 'incomplete' }, { day: 12, isCurrent: true, type: 'selected' }, { day: 13, isCurrent: true, type: 'incomplete' }, { day: 14, isCurrent: true, type: 'personal-group' }, { day: 15, isCurrent: true, type: 'incomplete' },
    // 4주차
    { day: 16, isCurrent: true, type: 'personal-group' }, { day: 17, isCurrent: true, type: 'incomplete' }, { day: 18, isCurrent: true, type: 'personal-group' }, { day: 19, isCurrent: true, type: 'incomplete' }, { day: 20, isCurrent: true, type: 'incomplete' }, { day: 21, isCurrent: true, type: 'personal-group' }, { day: 22, isCurrent: true, type: 'incomplete' },
    // 5주차
    { day: 23, isCurrent: true, type: 'incomplete' }, { day: 24, isCurrent: true, type: 'personal-group' }, { day: 25, isCurrent: true, type: 'incomplete' }, { day: 26, isCurrent: true, type: 'personal-group' }, { day: 27, isCurrent: true, type: 'incomplete' }, { day: 28, isCurrent: true, type: 'incomplete' }, { day: 29, isCurrent: true, type: 'incomplete' },
    // 6주차
    { day: 30, isCurrent: true, type: 'personal-group' }, { day: 31, isCurrent: true, type: 'incomplete' }, { day: 1, isCurrent: false, type: 'none' }, { day: 2, isCurrent: false, type: 'none' }, { day: 3, isCurrent: false, type: 'none' }, { day: 4, isCurrent: false, type: 'none' }, { day: 5, isCurrent: false, type: 'none' },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-6 pb-[100px] flex flex-col">
        
        {/* 1. 상단 헤더 */}
        <div className="flex items-center justify-center relative bg-white pb-6 shrink-0">
          <button onClick={() => router.back()} className="absolute left-1 top-0 text-[22px] font-bold text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[18px] font-extrabold text-[#000000]">지난 미션</h1>
          <button className="absolute right-1 top-0 text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M9 16h6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 2. 월 이동 네비게이션 */}
        <div className="flex items-center justify-between px-4 mb-5 shrink-0">
          <button className="p-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
          <span className="text-[16px] font-extrabold text-[#222222]">2026년 8월</span>
          <button className="p-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>

        {/* 3. 필터 탭 */}
        <div className="flex bg-[#F9F9F9] rounded-full p-1 mb-6 shrink-0">
          <button className="flex-1 py-[10px] bg-[#A7FBE7] rounded-full text-[14px] font-extrabold text-[#222222] shadow-sm">전체</button>
          <button className="flex-1 py-[10px] text-[14px] font-bold text-[#888888]">완료</button>
          <button className="flex-1 py-[10px] text-[14px] font-bold text-[#888888]">미완료</button>
        </div>

        {/* 4. 달력 요일 헤더 */}
        <div className="grid grid-cols-7 text-center mb-4 shrink-0">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <span key={idx} className="text-[13px] font-bold text-[#888888]">{day}</span>
          ))}
        </div>

        {/* 5. 달력 그리드 */}
        <div className="grid grid-cols-7 gap-y-6 gap-x-1 shrink-0 mb-6">
          {calendarData.map((item, index) => (
            <div key={index} className="flex flex-col items-center relative">
              {/* 날짜 동그라미 배경 */}
              <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[14px] font-bold relative z-10
                ${!item.isCurrent ? 'text-[#D0D0D0]' : 'text-[#333333]'}
                ${item.type === 'incomplete' || item.type === 'group-only' ? 'bg-[#F5F5F5]' : ''}
                ${item.type === 'personal-group' ? 'bg-[#A7FBE7]' : ''}
                ${item.type === 'selected' ? 'border-[1.5px] border-[#41C0A1] text-[#222222]' : ''}
              `}>
                {item.day}
              </div>
              
              {/* 하단 점 표시 (그룹/개인 미션 상태 표시용) */}
              <div className="absolute -bottom-[8px] flex gap-[2px] z-20">
                {item.type === 'personal-group' && <span className="w-[4px] h-[4px] rounded-full bg-[#B39DDB]"></span>}
                {item.type === 'group-only' && <span className="w-[4px] h-[4px] rounded-full bg-[#B39DDB]"></span>}
                {item.type === 'selected' && (
                  <>
                    <span className="w-[5px] h-[5px] rounded-full bg-[#41C0A1] border-[1px] border-white"></span>
                    <span className="w-[5px] h-[5px] rounded-full bg-[#B39DDB] border-[1px] border-white"></span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 6. 범례 (Legend) */}
        <div className="flex items-center justify-center gap-4 mt-2 mb-8 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-[8px] h-[8px] rounded-full bg-[#A7FBE7]"></span>
            <span className="text-[12px] font-bold text-[#888888]">개인 완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[8px] h-[8px] rounded-full bg-[#B39DDB]"></span>
            <span className="text-[12px] font-bold text-[#888888]">그룹 완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[8px] h-[8px] rounded-full bg-[#F5F5F5]"></span>
            <span className="text-[12px] font-bold text-[#888888]">미완료</span>
          </div>
        </div>

        {/* 7. 하단 상세 내역 카드 (선택된 날짜) */}
        <div className="bg-[#F4FBF9] rounded-[24px] p-5 flex flex-col shrink-0 mt-auto border border-gray-50">
          <div className="flex justify-between items-end mb-5">
            <span className="text-[16px] font-extrabold text-[#222222]">8월 12일 수요일</span>
            <span className="text-[13px] font-bold text-[#41C0A1]">3 / 3 완료</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[32px] h-[32px] rounded-full bg-[#E5F7F1] flex items-center justify-center text-[#41C0A1]">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                </div>
                <span className="text-[14px] font-bold text-[#333333]">20분 걷기</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#41C0A1" className="text-white"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.824 7.653-7.568-1.06-1.06-6.593 6.513z"/></svg>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[32px] h-[32px] rounded-full bg-[#E5F7F1] flex items-center justify-center text-[#41C0A1]">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                </div>
                <span className="text-[14px] font-bold text-[#333333]">물 2L 마시기</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#41C0A1" className="text-white"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.824 7.653-7.568-1.06-1.06-6.593 6.513z"/></svg>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[32px] h-[32px] rounded-full bg-[#E5F7F1] flex items-center justify-center text-[#41C0A1]">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                </div>
                <span className="text-[14px] font-bold text-[#333333]">밤 12시 전 취침</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#41C0A1" className="text-white"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.824 7.653-7.568-1.06-1.06-6.593 6.513z"/></svg>
            </div>
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
        <TabIcon 
          icon="users" 
          label="그룹" 
          onClick={() => router.push('/group')} 
        />
        <TabIcon 
          icon="check" 
          label="미션" 
          onClick={() => router.push('/mission')} 
        />
        <TabIcon 
          icon="leaf" 
          label="W 정원" 
          onClick={() => router.push('/garden')} 
        />
        <TabIcon 
          icon="bar-chart" 
          label="기록" 
          isActive 
          onClick={() => router.push('/record/report')} 
        />
      </div>
    </div>
  );

  // 하단 탭 아이콘 컴포넌트
  function TabIcon({ icon, label, isActive = false, onClick }: { icon: string, label: string, isActive?: boolean, onClick?: () => void }) {
    const colorClass = isActive ? "text-[#41C0A1]" : "text-[#BDBDBD]";
    return (
      <div onClick={onClick} className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}>
        {icon === 'users' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        )}
        {icon === 'check' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
        )}
        {icon === 'leaf' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        )}
        {icon === 'bar-chart' && (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z"/>
          </svg>
        )}
        <span className="text-[10px] font-bold">{label}</span>
      </div>
    );
  }
}