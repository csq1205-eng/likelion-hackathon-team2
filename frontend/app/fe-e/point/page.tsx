'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";

interface Transaction {
  transactionId: number;
  transactionType: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface PointResponse {
  userId: number;
  balance: number;
  totalEarned: number;
  totalUsed: number;
  entryTicketCount: number;
  recentTransactions: Transaction[];
}

interface StreakResponse {
  userId: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastCompletedDate: string;
}

//더미 데이터
const FALLBACK_POINT_DATA: PointResponse = {
  userId: 1,
  balance: 2450,
  totalEarned: 2000,
  totalUsed: 800,
  entryTicketCount: 3,
  recentTransactions: [
    { transactionId: 1, transactionType: "EARN", amount: 30, reason: "미션 인증", createdAt: "오늘" },
    { transactionId: 2, transactionType: "EARN", amount: 100, reason: "W 정원 완성", createdAt: "오늘" }
  ]
};

const FALLBACK_STREAK_DATA: StreakResponse = {
  userId: 1,
  currentStreakDays: 9,
  longestStreakDays: 14,
  lastCompletedDate: "2026-08-17"
};

export default function PointRewardPage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [pointData, setPointData] = useState<PointResponse | null>(null);
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      console.warn("엑세스 토큰이 없습니다. 임시 포인트 데이터를 띄웁니다.");
      setPointData(FALLBACK_POINT_DATA);
      setStreakData(FALLBACK_STREAK_DATA);
      setIsLoading(false);
      return;
    }

    const fetchPoints = async () => {
      try {
        const [pointsRes, streakRes] = await Promise.all([
          fetch('/api/v1/users/{userId}/points', {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`/api/v1/users/{userId}/streak`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
          })
        ]);

        const pointsResult = await pointsRes.json();
        const streakResult = await streakRes.json();

        // 포인트 세팅
        if (pointsRes.ok && pointsResult.success) {
          setPointData(pointsResult.data);
        } else {
          setPointData(FALLBACK_POINT_DATA);
        }

        // 연속 기록 세팅
        if (streakRes.ok && streakResult.success) {
          setStreakData(streakResult.data);
        } else {
          setStreakData(FALLBACK_STREAK_DATA);
        }

      } catch (error) {
        console.error("데이터 조회 실패! :", error);
        setPointData(FALLBACK_POINT_DATA);
        setStreakData(FALLBACK_STREAK_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoints();
  }, [authLoading, accessToken]);

  const handleGardenClick = () => {
    const savedGroupId = typeof window !== 'undefined' ? localStorage.getItem('myGroupId') || '1' : '1';
    router.push(`/fe-d/${savedGroupId}/garden`);
  };

  if (isLoading || !pointData || !streakData) {
    return (
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#41C0A1] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-[#999]">포인트 정보를 불러오는 중...</p>
      </div>
    );
  }

  const point = {
    balance: pointData.balance.toLocaleString(),
    reward: {
      count: pointData.entryTicketCount,
      message: pointData.entryTicketCount > 0 ? '장을 받았어요!' : '장이 필요해요',
      buttonLabel: pointData.entryTicketCount > 0 ? '응모권 확인' : '응모권 모으기'
    },
    transactions: pointData.recentTransactions.map(tx => ({
      ...tx,
      formattedAmount: tx.transactionType === 'EARN' ? `+${tx.amount}` : `-${tx.amount}`,
      isEarn: tx.transactionType === 'EARN'
    }))
  };

  const streak = {
    current: streakData.currentStreakDays,
    longest: streakData.longestStreakDays,
    progressPercent: Math.min((streakData.currentStreakDays / 1000000) * 100, 100) // 최대 100%
  };

  return (
    <div className="px-5 relative w-full h-[100dvh] bg-[#F9F9F9] flex flex-col overflow-hidden">
      
      {/* 상단 헤더 */}
      <button 
        onClick={() => router.back()} 
        className="absolute left-5 text-[22px] font-bold text-[#A0A0A0] mt-[14px]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1 className="text-[18px] font-bold text-[#000000] text-center mt-[12px] mb-[12px]">포인트</h1>
      

      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-[12px] pb-[100px] flex flex-col gap-4">
        
        {/* 보유 포인트 카드 */}
        <div className="relative bg-gradient-to-r from-[#F0F9F7] to-[#F4FAF9] rounded-[16px] p-[10px] flex flex-col justify-center overflow-hidden shadow-sm shrink-0">
          <Image 
              src="/bg_point_have.jpg"
              alt="포인트 bg"
              fill
              className="object-cover object-right"
          />
          <span className="text-[13px] font-bold text-[#666666] mb-1 z-10">보유 포인트</span>
          <div className="flex items-baseline gap-1 z-10">
            <span className="text-[30px] font-extrabold text-[#41C0A1] tracking-tight">{point.balance}</span>
            <span className="text-[20px] font-bold text-[#41C0A1]">P</span>
          </div>
        </div>

        {/* W 정원 완성 리워드 카드 */}
        <div className="relative bg-white rounded-[16px] p-[10px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col justify-between overflow-hidden shadow-sm shrink-0">
          <Image
            src="/bg_point_entryTicket.jpg"
            alt="리워드 티켓 bg"
            fill
            className="object-cover object-left z-0"
          />
          <div className="relative z-10 flex items-center gap-3 pl-[90px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#666666] mb-0.5">W 정원 완성 리워드</span>
              <span className="text-[14px] font-bold text-[#222222]">응모권 <span className="text-[#41C0A1]">{point.reward.count}</span>{point.reward.message}</span>
            </div>
          </div>
          <button className="relative z-10 w-[100px] py-[4px] mt-[6px] ml-[120px] rounded-full border-[1.5px] border-[#41C0A1] text-[#41C0A1] text-[13px] font-bold hover:bg-[#F0FDF8] transition-colors shrink-0">
            {point.reward.buttonLabel}
          </button>
        </div>

        {/* 맞춤 케어 추천 영역 */}
        <div className="mt-2 flex flex-col shrink-0">
          <h2 className="text-[15px] font-extrabold text-[#000000]">{streakData.currentStreakDays}일 기록으로 찾은 맞춤 케어</h2>
          <p className="text-[11px] text-[#666666] font-medium mb-[12px]">가지고 있지 않은 제품 중 지금 필요한 순서로 골랐어요.</p>

          {/* 1순위 카드 */}
          <div className="relative bg-white rounded-[24px] p-[16px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden mb-3">
            <div className="inline-block bg-[#41C0A1] text-white text-[11px] font-bold px-2.5 py-1 rounded-md w-max mb-2">1순위</div>
            <span className="absolute mt-[3px] ml-[52px] text-[13px] font-bold text-[#41C0A1]">선크림</span>
            <span className="text-[15px] font-extrabold text-[#222222] mt-0.5">AAC 시카 선크림</span>
            
            <div className="flex items-start gap-1.5 mt-2 mb-4 pr-[110px] z-10">
              <span className="text-[#41C0A1] text-[13px] leading-none mt-0.5">✦</span>
              <p className="text-[10.5px] text-[#555555] font-medium leading-relaxed">
                최근 자외선 노출이 많았어요.<br />지금부터 하나 챙겨보는 건 어떨까요?
              </p>
            </div>
            
            <button onClick={() => alert('상세페이지로 이동합니다!')}
              className="w-[90px] py-[8px] rounded-full bg-[#41C0A1] text-white font-bold text-[13px] z-10">
              제품 보기
            </button>

            {/* 1순위 제품 이미지 영역 */}
            <div className="absolute right-[-4px] bottom-[40px] w-[130px] h-[150px] z-0">
              <Image src="/point_suncream.jpg" alt="선크림" fill className="object-contain opacity-95" />
            </div>
            <div className="absolute right-4 bottom-3 text-[#41C0A1] text-[11px] font-bold z-10 flex items-center gap-0.5">
              ✦ 추천
            </div>
          </div>

          {/* 2순위 카드 */}
          <div className="relative bg-white rounded-[24px] p-[16px] border border-[#F3EDFF] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden mb-3">
            
            {/* 좌측: 텍스트 및 버튼 영역 */}
            <div className="flex flex-col z-10 pr-[70px]">
              <div className="inline-block bg-[#B39DDB] text-white text-[11px] font-bold px-2.5 py-1 rounded-md w-max mb-2">
                2순위
              </div>
              <span className="absolute mt-[3px] ml-[52px] text-[13px] font-bold text-[#B39DDB]">바디</span>
              <span className="text-[14px] font-extrabold text-[#222222] mt-0.5 tracking-tight">
                AAC 모이스처 바디로션
              </span>
              
              <div className="flex items-start gap-1.5 mt-2 mb-4">
                <span className="text-[#B39DDB] text-[12px] leading-none mt-0.5">✦</span>
                <p className="text-[11px] text-[#555555] font-medium leading-relaxed">
                  보유하지 않은<br /> 바디 케어 제품이에요.
                </p>
              </div>

              <button onClick={() => alert('상세페이지로 이동합니다!')}
                className="w-[89px] py-[7px] rounded-full border-[1.5px] border-[#B39DDB] text-[#B39DDB] font-bold text-[13px] bg-white hover:bg-[#F9F7FD] transition-colors">
                제품 보기
              </button>
            </div>
            
            <div className="absolute right-[-5px] bottom-1 w-[130px] h-[140px] mr-[4px] mb-[6px] z-0">
               <Image 
                 src="/point_bodylotion.png" 
                 alt="바디로션" 
                 fill 
                 className="object-contain" 
               />
            </div>
            
          </div>
        </div>

        {/* 최근 적립 내역 */}
        <div className="mt-[4px] flex flex-col shrink-0 bg-white rounded-[24px] p-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-gray-50">
          <h2 className="text-[16px] font-extrabold text-[#000000] mb-[12px]">최근 적립</h2>
          
          <div className="flex flex-col gap-[12px]">
            {/* 내역 1 */}
            {point.transactions.length > 0 ? (
              point.transactions.map((tx) => (
                <div key={tx.transactionId} className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                
                    <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center border ${
                      tx.isEarn ? 'bg-[#F0FDF8] border-[#E0F8F0] text-[#41C0A1]' : 'bg-[#FFF5F5] border-[#FFE3E3] text-[#FF5C5C]'
                    }`}>
                      {tx.isEarn ? (
                        <span className="font-extrabold text-[15px]">W</span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                      )}
                    </div>

                <div className="flex items-center gap-2">
                      <span className={`text-[15px] font-extrabold ${tx.isEarn ? 'text-[#41C0A1]' : 'text-[#FF5C5C]'}`}>
                        {tx.formattedAmount} P
                      </span>
                      <span className="text-[14px] text-[#555555] font-medium">{tx.reason}</span>
                    </div>
                  </div>
                  <span className="text-[13px] text-[#666666] font-medium pr-[2px]">{tx.createdAt}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-[13px] text-[#999999]">최근 적립 내역이 없습니다.</p>
            )}
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
        <TabIcon icon="users" label="그룹" onClick={() => router.push('/fe-e/group')} />
        <TabIcon icon="check" label="미션" onClick={() => router.push('/fe-d/mission')} />
        <TabIcon icon="leaf" label="W 정원" isActive onClick={handleGardenClick} />
        <TabIcon icon="bar-chart" label="기록" onClick={() => router.push('/fe-e/record/report')} />
      </div>
    </div>
  );
}

// 하단 탭 아이콘 컴포넌트
function TabIcon({ icon, label, isActive = false, onClick }: { icon: string, label: string, isActive?: boolean, onClick?: () => void }) {
  const colorClass = isActive ? 'text-[#41C0A1]' : 'text-[#BDBDBD]';
  return (
    <div onClick={onClick} className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}>
      {/* 아이콘 로직은 기존과 동일 */}
      {icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
      {icon === 'check' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
      {icon === 'leaf' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
      {icon === 'bar-chart' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z" /></svg>}
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}