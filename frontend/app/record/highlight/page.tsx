'use client';

import { useRouter } from 'next/navigation';

export default function HighlightArchivePage() {
  const router = useRouter();

  // 날짜별 하이라이트 리스트 데이터 (시안 기준)
  const highlights = [
    { id: 1, date: '8월 12일 (수)', current: 9, total: 21, time: '00:30', theme: 'mountain' },
    { id: 2, date: '8월 11일 (화)', current: 7, total: 21, time: '00:30', theme: 'bunting' },
    { id: 3, date: '8월 10일 (월)', current: 11, total: 21, time: '00:30', theme: 'leaf' },
    { id: 4, date: '8월 9일 (일)', current: 6, total: 21, time: '00:30', theme: 'balloon' },
    { id: 5, date: '8월 8일 (토)', current: 10, total: 21, time: '00:30', theme: 'star' },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-6 pb-[120px] flex flex-col">
        
        {/* 1. 상단 헤더 */}
        <div className="flex items-center justify-center relative bg-white pb-6 shrink-0">
          <button onClick={() => router.back()} className="absolute left-1 top-0 text-[22px] font-bold text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[18px] font-extrabold text-[#000000]">하이라이트</h1>
          <button className="absolute right-1 top-0 text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
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
          <button className="flex-1 py-[10px] text-[14px] font-bold text-[#888888]">이번 주</button>
          <button className="flex-1 py-[10px] text-[14px] font-bold text-[#888888]">완주</button>
        </div>

        {/* 4. 이번 주 대표 카드 */}
        <div className="bg-[#F0FDF8] rounded-[24px] p-5 flex flex-row items-center justify-between shadow-sm shrink-0 mb-8 border border-[#E8F8F3]">
          <div className="flex flex-col">
            <h2 className="text-[16px] font-extrabold text-[#222222]">이번 주 우리의 하루</h2>
            <p className="text-[12px] text-[#555555] font-medium mt-1 mb-3">8. 6 - 8. 12</p>
            
            <div className="flex items-center gap-1.5 text-[#41C0A1] font-bold text-[13px] mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              00:30
            </div>

            <div className="flex gap-2">
              <div className="bg-[#E5F7F1] text-[#41C0A1] text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                공유 클립 6
              </div>
              <div className="bg-[#F3EFFF] text-[#8B6DF8] text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="5" width="18" height="14" rx="2" ry="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="10" x2="8" y2="19" /></svg>
                완료 카드 9
              </div>
            </div>
          </div>

          {/* 대표 썸네일 이미지 (CSS로 그린 임시 그래픽) */}
          <div className="w-[120px] h-[90px] bg-[#D1F2E8] rounded-[12px] relative overflow-hidden shrink-0 flex flex-col justify-end p-2 gap-1">
             <div className="absolute top-3 right-4 w-4 h-4 rounded-full bg-[#A5E3D0]"></div>
             <div className="absolute bottom-3 right-[-10px] w-20 h-20 bg-[#8CE0C6] rotate-45 transform origin-bottom-left"></div>
             <div className="absolute bottom-2 left-2 w-16 h-16 bg-[#A5E3D0] rotate-45 transform origin-bottom-left"></div>
             
             {/* 썸네일 하단 진행바 장식 */}
             <div className="flex gap-1 z-10 w-full px-1">
               <div className="h-1.5 flex-1 bg-white/60 rounded-full"></div>
               <div className="h-1.5 flex-1 bg-white/60 rounded-full"></div>
             </div>
          </div>
        </div>

        {/* 5. 날짜별 하이라이트 리스트 */}
        <div className="flex flex-col shrink-0">
          <h3 className="text-[16px] font-extrabold text-[#222222] mb-4">날짜별 하이라이트</h3>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {highlights.map((item) => (
              <div key={item.id} className="flex flex-col gap-1.5">
                {/* 썸네일 영역 */}
                <div className="w-full aspect-[2/1] bg-[#F4FBF9] rounded-[16px] relative flex items-center justify-center overflow-hidden">
                  <svg className="absolute top-2 left-2 w-4 h-4 text-[#41C0A1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  
                  {/* 테마별 썸네일 그래픽 (시안의 흐릿한 패턴들 구현) */}
                  {item.theme === 'mountain' && (
                    <div className="absolute bottom-0 w-[80%] h-[60%] flex items-end opacity-40">
                      <div className="w-[60%] h-[100%] bg-[#41C0A1] clip-triangle origin-bottom"></div>
                      <div className="w-[80%] h-[70%] bg-[#41C0A1] clip-triangle origin-bottom -ml-4"></div>
                      <div className="absolute top-0 right-4 w-4 h-4 rounded-full bg-[#41C0A1]"></div>
                    </div>
                  )}
                  {item.theme === 'bunting' && (
                    <div className="absolute top-0 w-full h-full flex flex-col justify-between opacity-30 p-2">
                       <div className="w-full border-t-[4px] border-dashed border-[#41C0A1]"></div>
                       <svg className="absolute bottom-2 right-4 w-6 h-6 text-[#41C0A1]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                  )}
                  {item.theme === 'leaf' && (
                    <div className="opacity-30">
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="#41C0A1"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c3.47.5 6.87-1.22 8.35-4.43C16.89 11 17.5 8 17 8z"/></svg>
                    </div>
                  )}
                  {item.theme === 'balloon' && (
                    <div className="opacity-30 flex gap-1 items-center">
                       <div className="w-7 h-8 bg-gray-400 rounded-[50%] rounded-b-md"></div>
                       <div className="w-8 h-9 bg-[#41C0A1] rounded-[50%] rounded-b-md -mt-2"></div>
                    </div>
                  )}
                  {item.theme === 'star' && (
                    <div className="opacity-30 flex gap-2 items-center">
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="#41C0A1"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </div>
                  )}
                </div>
                {/* 텍스트 영역 */}
                <div className="flex items-center gap-1 text-[11px] font-extrabold whitespace-nowrap">
                  <span className="text-[#333333]">{item.date}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[#41C0A1]">{item.current} / {item.total}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[#555555]">{item.time}</span>
                </div>
              </div>
            ))}

            {/* 잠긴 하이라이트 아이템 */}
            <div className="w-full aspect-[2/1] bg-[#F9F9F9] rounded-[16px] flex flex-col items-center justify-center gap-1.5 border border-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span className="text-[10px] text-[#A0A0A0] font-bold text-center leading-tight">
                미션 완료 후<br/>하이라이트가 생겨요
              </span>
            </div>
          </div>
        </div>

        {/* 6. 하단 안내 배너 */}
        <div className="mt-8 bg-[#F9F9F9] rounded-[16px] p-4 flex items-center gap-3 shrink-0">
          <div className="text-[#41C0A1] shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <p className="text-[12px] text-[#666666] font-medium leading-relaxed">
            공유 멤버의 클립만 영상에 담고,<br />비공유 멤버는 완료 카드로 보여요.
          </p>
        </div>

      </div>

      {/* 하단 탭 바 (GNB) - '기록' 탭 활성화 */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-6 pt-2 pb-6 z-50">
        <TabIcon icon="home" label="홈" onClick={() => router.push('/')} />
        <TabIcon icon="check" label="미션" onClick={() => router.push('/mission')} />
        <TabIcon icon="leaf" label="W 정원" onClick={() => router.push('/garden')} />
        <TabIcon icon="users" label="그룹" onClick={() => router.push('/group')} />
        <TabIcon icon="bar-chart" label="기록" isActive onClick={() => router.push('/record/report')} />
      </div>
      
      {/* 💡 CSS용 스타일 태그 (삼각형 클립용) */}
      <style dangerouslySetInnerHTML={{__html: `
        .clip-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
      `}} />
    </div>
  );

  // 하단 탭 아이콘 컴포넌트
  function TabIcon({ icon, label, isActive = false, onClick }: { icon: string, label: string, isActive?: boolean, onClick?: () => void }) {
    const colorClass = isActive ? "text-[#41C0A1]" : "text-[#BDBDBD]";
    return (
      <div onClick={onClick} className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}>
        {icon === 'home' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        )}
        {icon === 'check' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
        )}
        {icon === 'leaf' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        )}
        {icon === 'users' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
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