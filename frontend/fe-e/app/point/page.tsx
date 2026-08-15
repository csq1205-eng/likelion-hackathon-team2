'use client';

import { useRouter } from 'next/navigation';

export default function PointRewardPage() {
  const router = useRouter();

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 pt-6 pb-[120px] flex flex-col">
        
        {/* 상단 헤더 */}
        <div className="flex flex-col items-center justify-center relative bg-white pb-4 shrink-0">
          <button 
            onClick={() => router.back()} 
            className="absolute left-1 top-0 text-[22px] font-bold text-black"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[18px] font-extrabold text-[#000000]">포인트</h1>
        </div>

        {/* 1. 보유 포인트 카드 */}
        <div className="relative bg-gradient-to-r from-[#F0FCF9] to-[#E2F7F2] rounded-[24px] p-6 flex flex-col justify-center overflow-hidden shadow-sm shrink-0">
          <span className="text-[13px] font-bold text-[#888888] mb-1 z-10">보유 포인트</span>
          <div className="flex items-baseline gap-1 z-10">
            <span className="text-[36px] font-extrabold text-[#41C0A1] tracking-tight">2,450</span>
            <span className="text-[20px] font-bold text-[#41C0A1]">P</span>
          </div>
          
          {/* 장식용 별 */}
          <div className="absolute top-6 right-[45%] text-[#83E2C4] opacity-80 text-[14px]">✦</div>
          <div className="absolute bottom-5 left-[45%] text-[#83E2C4] opacity-60 text-[18px]">✦</div>
          <div className="absolute top-10 right-[10%] text-[#B39DDB] opacity-70 text-[16px]">✦</div>

          {/* 캐릭터 이미지 (임시) */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-[110px] h-[110px] flex items-center justify-center z-0">
             <div className="text-[70px]">👾</div>
             <div className="absolute bottom-0 right-2 w-[36px] h-[36px] bg-[#D4F2A6] rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
                <span className="text-[#888888] font-bold text-[14px]">P</span>
             </div>
          </div>
        </div>

        {/* 2. W 정원 완성 리워드 카드 */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-row items-center justify-between mt-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* 티켓 아이콘 (임시) */}
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-[#E6E0F8] to-[#C9BFFE] rounded-[16px] flex items-center justify-center shadow-sm relative">
               <span className="text-white font-extrabold text-[28px]">W</span>
               <div className="absolute -bottom-1 -right-1 text-[#FFD700] text-[14px]">✦</div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#888888] mb-1">W 정원 완성 리워드</span>
              <span className="text-[15px] font-bold text-[#222222]">응모권 <span className="text-[#41C0A1]">3</span>장을 받았어요!</span>
            </div>
          </div>
          
          <button className="px-4 py-2 rounded-full border-[1.5px] border-[#41C0A1] text-[#41C0A1] text-[13px] font-bold hover:bg-[#F0FDF8] transition-colors shrink-0">
            응모권 확인
          </button>
        </div>

        {/* 3. 맞춤 케어 추천 영역 */}
        <div className="mt-8 flex flex-col shrink-0">
          <h2 className="text-[18px] font-extrabold text-[#000000]">21일 기록으로 찾은 맞춤 케어</h2>
          <p className="text-[12px] text-[#888888] font-medium mt-1 mb-4">가지고 있지 않은 제품 중 지금 필요한 순서로 골랐어요.</p>

          {/* 1순위 카드 (민트) */}
          <div className="relative bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden mb-3">
            <div className="inline-block bg-[#41C0A1] text-white text-[11px] font-bold px-2.5 py-1 rounded-md w-max mb-3">1순위</div>
            <span className="text-[13px] font-bold text-[#41C0A1]">선크림</span>
            <span className="text-[16px] font-extrabold text-[#222222] mt-1">AAC 시카 선크림</span>
            
            <div className="flex items-start gap-1.5 mt-3 mb-5 pr-[100px] z-10">
              <span className="text-[#41C0A1] text-[14px] leading-none mt-0.5">✦</span>
              <p className="text-[12px] text-[#555555] font-medium leading-relaxed">
                최근 자외선 노출이 많았는데<br />선크림이 없으시네요.<br />지금부터 하나 챙겨보는 건 어떨까요?
              </p>
            </div>
            
            <button className="w-[140px] py-[12px] rounded-full bg-[#41C0A1] text-white font-bold text-[14px] hover:bg-[#38a88d] transition-colors z-10">
              제품 보기
            </button>

            {/* 제품 이미지 (임시) */}
            <div className="absolute right-[-10px] bottom-4 w-[130px] h-[150px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex items-center justify-center z-0 opacity-70">
              <span className="text-gray-400 text-xs">제품 이미지</span>
            </div>
            <div className="absolute right-4 bottom-4 text-[#41C0A1] text-[10px] font-bold z-10 flex items-center gap-1">
              ✦ 추천
            </div>
          </div>

          {/* 2순위 카드 (퍼플) */}
          <div className="relative bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-row items-center justify-between overflow-hidden">
            <div className="flex flex-col z-10">
              <div className="inline-block bg-[#B39DDB] text-white text-[11px] font-bold px-2.5 py-1 rounded-md w-max mb-2">2순위</div>
              <span className="text-[12px] font-bold text-[#B39DDB]">바디</span>
              <span className="text-[15px] font-extrabold text-[#222222] mt-0.5">AAC 모이스처 바디로션</span>
              
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[#B39DDB] text-[12px]">✦</span>
                <p className="text-[12px] text-[#555555] font-medium">보유하지 않은 바디 케어 제품이에요.</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 z-10">
              <button className="px-5 py-[10px] rounded-full border-[1.5px] border-[#B39DDB] text-[#B39DDB] font-bold text-[13px] hover:bg-[#F9F7FF] transition-colors bg-white">
                제품 보기
              </button>
            </div>
            
             {/* 제품 이미지 (임시) */}
             <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 w-[60px] h-[80px] bg-gray-50 rounded flex items-center justify-center z-0 opacity-50">
               <span className="text-gray-300 text-[8px]">이미지</span>
             </div>
          </div>
        </div>

        {/* 4. 최근 적립 내역 */}
        <div className="mt-8 flex flex-col shrink-0">
          <h2 className="text-[16px] font-extrabold text-[#000000] mb-4">최근 적립</h2>
          
          <div className="flex flex-col gap-5">
            {/* 내역 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-full bg-[#F0FDF8] border border-[#E0F8F0] flex items-center justify-center text-[#41C0A1]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-extrabold text-[#41C0A1]">+30 P</span>
                  <span className="text-[14px] text-[#555555] font-medium">미션 인증</span>
                </div>
              </div>
              <span className="text-[13px] text-[#888888] font-medium">오늘</span>
            </div>

            {/* 내역 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-full bg-[#41C0A1] flex items-center justify-center text-white font-extrabold text-[16px]">
                  W
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-extrabold text-[#41C0A1]">+100 P</span>
                  <span className="text-[14px] text-[#555555] font-medium">W 정원 완성</span>
                </div>
              </div>
              <span className="text-[13px] text-[#888888] font-medium">오늘</span>
            </div>
          </div>
        </div>

      </div>

      {/* 하단 탭 바 (GNB) - 'W 정원' 탭 활성화 */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-6 pt-2 pb-6 z-50">
        <TabIcon icon="home" label="홈" onClick={() => router.push('/')} />
        <TabIcon icon="check" label="미션" onClick={() => router.push('/mission')} />
        <TabIcon icon="leaf" label="W 정원" isActive onClick={() => router.push('/garden')} />
        <TabIcon icon="users" label="그룹" onClick={() => router.push('/group')} />
        <TabIcon icon="bar-chart" label="기록" onClick={() => router.push('/record/report')} />
      </div>
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