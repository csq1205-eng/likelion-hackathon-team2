'use client';

import { useRouter } from 'next/navigation';

export default function WeeklyReportPage() {
  const router = useRouter();

  // 요일별 미션 완료 데이터 (시안 기준)
  const weeklyData = [
    { day: '목', count: 1 },
    { day: '금', count: 2 },
    { day: '토', count: 4 },
    { day: '일', count: 3 },
    { day: '월', count: 2 },
    { day: '화', count: 4 },
    { day: '수', count: 2 },
  ];

  const maxCount = Math.max(...weeklyData.map(d => d.count));

  return (
    // 💡 1. fixed를 제거하고 relative와 h-[100dvh]를 사용하여 모바일 틀(부모) 안에서만 꽉 차게 수정했습니다.
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 💡 2. 본문 스크롤 영역: 네비바 높이만큼 하단에 여유 공간(pb-[100px])을 주어 버튼이 안 가려지게 합니다. */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-6 pb-[100px] flex flex-col">
        
        {/* 상단 헤더 */}
        <div className="flex flex-col items-center justify-center relative bg-white pb-2 shrink-0">
          <button 
            onClick={() => router.back()} 
            className="absolute left-1 top-1 text-[20px] font-bold text-black"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[18px] font-bold text-[#000000]">이번 주 리포트</h1>
          <p className="text-[13px] text-[#666666] font-medium mt-1">8. 6 - 8. 12</p>
        </div>

        <div className="flex flex-col gap-3 mt-4 shrink-0">
          
          {/* 1. 총 완료 미션 카드 */}
          <div className="bg-[#F0FDF8] rounded-[16px] p-[12px] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#333333]">이번 주</span>
              <div className="flex items-baseline gap-1 mt-[2px]">
                <span className="text-[30px] font-extrabold text-[#000000] leading-none">18</span>
                <span className="text-[24px] font-bold text-[#000000]">개</span>
              </div>
              <span className="text-[13px] text-[#666666] font-medium mt-[2px]">미션 완료</span>
            </div>
            {/* 클립보드 아이콘 */}
            <div className="w-[60px] h-[60px] flex items-center justify-center text-[#74E3C8]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>

          {/* 2. 요일별 완료 수 바 차트 */}
          <div className="bg-[#F7F7F7] rounded-[16px] p-[12px] flex flex-col">
            <h2 className="text-[14px] font-bold text-[#333333] mb-6">요일별 완료 수</h2>
            <div className="flex justify-between items-end h-[100px] px-2">
              {weeklyData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-[12px] font-bold text-[#555555]">{data.count}</span>
                  {/* 바 그래프 (높이 자동 계산) */}
                  <div className="w-[20px] bg-[#97EAD6] rounded-t-md" style={{ height: `${(data.count / maxCount) * 60}px` }}></div>
                  <span className="text-[12px] text-[#888888] font-medium mt-[2px]">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 2단 그리드 카드 영역 */}
          <div className="grid grid-cols-2 gap-[14px]">
            
            {/* 달성률 도넛 차트 */}
            <div className="bg-[#F7F7F7] rounded-[24px] p-[16px] flex flex-col items-center text-center">
              <span className="text-[13px] font-bold text-[#333333] w-full text-left">달성률</span>
              <span className="text-[28px] font-extrabold text-[#41C0A1] mt-2 leading-none">86%</span>
              <span className="text-[12px] font-semibold text-[#8B9A95] mt-1 mb-3">18 / 21</span>
              {/* SVG 도넛 차트 */}
              <div className="relative w-[70px] h-[70px]">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 overflow-visible">
                  <path className="text-[#E8F8F3]" strokeWidth="6" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#64DFBC]" strokeWidth="6" strokeDasharray="86, 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>

            {/* 가장 잘 지킨 습관 */}
            <div className="bg-[#F7F7F7] rounded-[24px] p-[16px] flex flex-col items-center justify-center text-center">
              <span className="text-[13px] font-bold text-[#333333] w-full text-left">가장 잘 지킨 습관</span>
              <svg className="w-8 h-8 text-[#41C0A1] mt-2 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
              </svg>
              <span className="text-[12px] text-[#555555] font-semibold mt-1">
                물 2L 마시기<br /><span className="text-[#41C0A1]">5일 성공</span>
              </span>
            </div>

            {/* AI 한줄 리포트 */}
            <div className="bg-[#F7F7F7] rounded-[24px] p-[16px] flex flex-col justify-center">
              <span className="text-[13px] font-bold text-[#333333] mb-2">AI 한줄 리포트</span>
              <p className="text-[12px] text-[#666666] font-medium leading-relaxed">
                규칙적인 수면과 수분 섭취 습관이 <br />이번 주 성과의 비결이에요.
              </p>
            </div>

            {/* 7일 연속 달성 */}
            <div className="bg-[#F7F7F7] rounded-[24px] p-[16px] flex flex-col items-center justify-center text-center">
              <span className="text-[13px] font-bold text-[#333333] w-full text-left">7일 연속 달성</span>
              <span className="text-[42px] font-extrabold text-[#41C0A1] mt-2 leading-none">7</span>
            </div>

          </div>

          {/* 4. 기록 알림 배너 */}
          <div className="bg-[#F3EFFF] rounded-[24px] p-[16px] mt-2 flex flex-row items-center gap-4 shadow-sm">
            <div className="w-[40px] h-[40px] shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-[#7B61FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#5B3BC4]">21일 기록이 쌓이고 있어요</span>
              <span className="text-[12px] text-[#666666] font-medium mt-1 leading-snug">완주하면 행동 기록을 바탕으로 필요한 케어를 알려드려요.</span>
            </div>
          </div>

          {/* 지난주 보기 버튼 */}
          <button onClick={() => router.push('/record/calendar')}
              className="w-full py-4 mt-2 rounded-[16px] border-[1.5px] border-[#64DFBC] text-[#41C0A1] font-bold text-[15px] bg-white hover:bg-[#F0FDF8] transition-colors shrink-0">
                지난주 보기
          </button>

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