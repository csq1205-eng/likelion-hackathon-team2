'use client';

import { useRouter } from 'next/navigation';

export default function HighlightPage() {
  const router = useRouter();

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[100px] flex flex-col relative">
        
        {/* 상단 반투명 민트색 그라데이션 배경 & 배경 꾸밈 요소 */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-b from-[#E8F8F5] to-white -z-10"></div>
        {/* 장식용 미니 별들 */}
        <div className="absolute top-[80px] left-[10%] text-[#83E2C4] opacity-70">✦</div>
        <div className="absolute top-[60px] left-[30%] text-[#A7FBE7] text-[20px]">✦</div>
        <div className="absolute top-[70px] right-[25%] text-[#83E2C4] opacity-80 text-[18px]">✦</div>
        <div className="absolute top-[90px] right-[10%] text-[#B39DDB] opacity-80 text-[14px]">✦</div>

        {/* 헤더 */}
        <div className="flex flex-col items-center justify-center relative pt-6 pb-4 shrink-0 z-10">
          <button 
            onClick={() => router.back()} 
            className="absolute left-5 top-7 text-[22px] font-bold text-black"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[17px] font-extrabold text-[#000000]">우리의 하루</h1>
          <p className="text-[12px] text-[#888888] font-medium mt-1">8월 12일 수요일</p>
        </div>

        {/* 중앙 3단 세로 카드 영역 */}
        <div className="flex flex-row justify-center gap-3 w-full px-5 mt-4 z-10">
          
          {/* 1. 효림 - 공유 클립 */}
          <div className="flex flex-col items-center w-1/3">
            <NumberStar num={1} color="#B39DDB" />
            <div className="relative w-full aspect-[4/9] rounded-[16px] overflow-hidden shadow-md mt-[-14px]">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop')] bg-cover bg-center"></div>
              <div className="absolute top-3 left-0 w-full flex justify-center z-10">
                <span className="bg-[#41C0A1] text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">효림 · 공유 클립</span>
              </div>
              <div className="absolute bottom-0 w-full pt-8 pb-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-[12px] font-semibold text-center italic">아침 선크림 완료!</p>
              </div>
            </div>
          </div>

          {/* 2. 민서 - 비공유 (완료 카드) */}
          <div className="flex flex-col items-center w-1/3">
            <NumberStar num={2} color="#B39DDB" />
            <div className="relative w-full aspect-[4/9] rounded-[16px] overflow-hidden shadow-md mt-[-14px] bg-gradient-to-b from-[#EAF9F4] to-[#BCEFE0] flex flex-col items-center border-[1.5px] border-white">
              <div className="absolute top-3 left-0 w-full flex justify-center z-10">
                <span className="bg-[#B39DDB] text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">비공유 · 완료 카드</span>
              </div>
              
              <div className="mt-[50%] w-[60px] h-[60px] bg-gradient-to-tr from-[#91EAD0] to-[#E8F8F5] rounded-full flex items-center justify-center shadow-inner relative">
                 <span className="text-3xl relative z-10">👾</span>
              </div>
              
              <span className="text-[14px] font-extrabold text-[#222222] mt-3">민서</span>
              <div className="bg-white/80 rounded-full px-2 py-1 flex items-center justify-center mt-1 w-[80%] shadow-sm">
                <span className="text-[#41C0A1] text-[10px] mr-1">💧</span>
                <span className="text-[9px] text-[#555555] font-bold truncate">물 2L 마시기</span>
              </div>
              <span className="text-[9px] text-[#888888] font-medium mt-auto mb-4">오전 7:34 완료</span>
            </div>
          </div>

          {/* 3. 지우 - 공유 클립 */}
          <div className="flex flex-col items-center w-1/3">
            <NumberStar num={3} color="#B39DDB" />
            <div className="relative w-full aspect-[4/9] rounded-[16px] overflow-hidden shadow-md mt-[-14px]">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=300&auto=format&fit=crop')] bg-cover bg-center"></div>
              <div className="absolute top-3 left-0 w-full flex justify-center z-10">
                <span className="bg-[#41C0A1] text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">지우 · 공유 클립</span>
              </div>
              <div className="absolute bottom-0 w-full pt-8 pb-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-[12px] font-semibold text-center italic">20분 걷기 성공!</p>
              </div>
            </div>
          </div>

        </div>

        {/* 썸네일 & 타임라인 플레이어 카드 */}
        <div className="px-5 mt-6">
          <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full border border-gray-50 flex flex-col">
            
            <div className="flex gap-2 justify-between">
              {/* 썸네일 1 */}
              <div className="relative w-1/3 aspect-[4/3] rounded-[12px] overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center opacity-80"></div>
                <div className="absolute top-1 w-full flex justify-center"><span className="bg-[#41C0A1] text-white text-[7px] font-bold px-1.5 py-[2px] rounded-full">공유 클립</span></div>
                <div className="absolute bottom-1.5 left-1.5 w-[18px] h-[18px] bg-[#41C0A1] rounded-full text-white text-[8px] flex items-center justify-center font-bold">01</div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/40 text-white text-[8px] px-1 py-[2px] rounded-md font-medium">0:05</div>
              </div>
              {/* 썸네일 2 */}
              <div className="relative w-1/3 aspect-[4/3] rounded-[12px] overflow-hidden shadow-sm bg-gradient-to-b from-[#EAF9F4] to-[#C3F0E2] flex items-center justify-center">
                <div className="absolute top-1 w-full flex justify-center"><span className="bg-[#B39DDB] text-white text-[7px] font-bold px-1.5 py-[2px] rounded-full">완료 카드</span></div>
                <span className="text-[20px]">👾</span>
                <div className="absolute bottom-1.5 left-1.5 w-[18px] h-[18px] bg-[#B39DDB] rounded-full text-white text-[8px] flex items-center justify-center font-bold">02</div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/40 text-white text-[8px] px-1 py-[2px] rounded-md font-medium">0:10</div>
              </div>
              {/* 썸네일 3 */}
              <div className="relative w-1/3 aspect-[4/3] rounded-[12px] overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center opacity-80"></div>
                <div className="absolute top-1 w-full flex justify-center"><span className="bg-[#41C0A1] text-white text-[7px] font-bold px-1.5 py-[2px] rounded-full">공유 클립</span></div>
                <div className="absolute bottom-1.5 left-1.5 w-[18px] h-[18px] bg-[#41C0A1] rounded-full text-white text-[8px] flex items-center justify-center font-bold">03</div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/40 text-white text-[8px] px-1 py-[2px] rounded-md font-medium">0:15</div>
              </div>
            </div>

            {/* 프로그레스 바 (진행도) */}
            <div className="relative w-full h-[5px] bg-[#EAEAEA] rounded-full mt-4">
              <div className="absolute top-0 left-0 h-full w-[70%] bg-[#41C0A1] rounded-full"></div>
              {/* 재생 핸들 */}
              <div className="absolute top-1/2 left-[70%] transform -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white border-[3.5px] border-[#B39DDB] rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* 재생 컨트롤 영역 */}
        <div className="flex flex-col items-center mt-5">
          <span className="text-[12px] font-bold text-[#555555]">00:22 / 00:30</span>
          
          <div className="flex items-center gap-10 mt-3">
            {/* -10초 버튼 */}
            <button className="text-black hover:opacity-70 transition-opacity flex items-center justify-center relative">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 2v6h6M2.66 15.5c1.1 3.2 4.1 5.5 7.6 5.5 4.5 0 8.2-3.7 8.2-8.2s-3.7-8.2-8.2-8.2c-2.3 0-4.4.9-5.9 2.4L2.5 8" />
              </svg>
              <span className="absolute text-[8px] font-bold top-[12px]">10</span>
            </button>
            
            {/* 재생 버튼 */}
            <button className="w-[42px] h-[42px] bg-black text-white rounded-full flex items-center justify-center pl-1 hover:bg-gray-800 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4l15 8-15 8z" />
              </svg>
            </button>

            {/* +10초 버튼 */}
            <button className="text-black hover:opacity-70 transition-opacity flex items-center justify-center relative">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.5c-1.1 3.2-4.1 5.5-7.6 5.5-4.5 0-8.2-3.7-8.2-8.2s3.7-8.2 8.2-8.2c2.3 0 4.4.9 5.9 2.4l1.9 1.9" />
              </svg>
              <span className="absolute text-[8px] font-bold top-[12px]">10</span>
            </button>
          </div>
        </div>

        {/* 안내 문구 영역 */}
        <div className="flex flex-col items-center px-6 mt-6 gap-2">
          <p className="text-[12px] text-[#555555] font-medium text-center leading-relaxed">
            공유 멤버는 실제 클립으로, 비공유 멤버는 완료 카드로<br />AI가 자막을 더해 30초 하이라이트를 만들어요. ✨
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#888888] font-medium mt-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            직접 공유한 클립만 친구에게 보여요
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex flex-row w-full px-5 gap-3 mt-6">
          <button className="flex-1 py-[14px] rounded-full border-[1.5px] border-[#E0E0E0] text-[#333333] font-bold text-[15px] bg-white hover:bg-gray-50 transition-colors">
            다시 보기
          </button>
          <button className="flex-1 py-[14px] rounded-full text-white font-bold text-[15px] bg-[#41C0A1] hover:bg-[#38a88d] transition-colors">
            공유하기
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

  // 상단 번호 별 모양 컴포넌트
  function NumberStar({ num, color }: { num: number, color: string }) {
    return (
      <div className="relative w-[34px] h-[34px] flex items-center justify-center z-20">
        <svg className="absolute inset-0 w-full h-full drop-shadow-sm" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l2.6 5.8 6.4.5-4.8 4.3 1.5 6.2-5.7-3.2-5.7 3.2 1.5-6.2-4.8-4.3 6.4-.5L12 2z" />
        </svg>
        <span className="relative text-white text-[13px] font-extrabold pb-[1px] pr-[1px]">{num}</span>
      </div>
    );
  }

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