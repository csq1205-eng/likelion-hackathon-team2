'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { apiRequest } from '@/lib/api/client';

// 멤버 프로필에 입힐 색상 테마 배열
const THEMES = [
  { bg: 'bg-[#EAF9F4]', text: 'text-[#50C2A4]' },
  { bg: 'bg-[#F3EDFB]', text: 'text-[#9884D2]' },
  { bg: 'bg-[#FFF3E0]', text: 'text-[#FFB74D]' },
  { bg: 'bg-[#F0F0F0]', text: 'text-[#A0A0A0]' },
];

interface MemberStatus {
  id: number;
  name: string;
  initial: string;
  bg: string;
  text: string;
  isCompleted: boolean;
}

export default function GroupStatusPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const { accessToken, isLoading: authLoading } = useAuth();

  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const useFallbackData = () => {
    console.log("통신 실패 또는 비로그인 상태! 임시 테스트 데이터를 띄웁니다.");
    setMembers([
      { id: 1, name: '프로필A', initial: 'A', bg: 'bg-[#EAF9F4]', text: 'text-[#50C2A4]', isCompleted: true },
      { id: 2, name: '프로필B', initial: 'B', bg: 'bg-[#F3EDFB]', text: 'text-[#9884D2]', isCompleted: true },
      { id: 3, name: '프로필C', initial: 'C', bg: 'bg-[#FFF3E0]', text: 'text-[#FFB74D]', isCompleted: true },
      { id: 4, name: '프로필D', initial: 'D', bg: 'bg-[#F0F0F0]', text: 'text-[#A0A0A0]', isCompleted: false },
    ]);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      useFallbackData();
      setIsLoading(false);
      return;
    }

    const fetchGroupStatus = async () => {
      if (!accessToken) return;

      try {
        const result = await apiRequest<any>(`/groups/${groupId}/status`, {
          accessToken,
        });

        const rawData = result.data || result;
        const mappedMembers = rawData.map((member: any, index: number) => {
          const theme = THEMES[index % THEMES.length];
          return {
            id: member.memberId || index,
            name: member.memberName || '알 수 없음',
            initial: member.memberName ? member.memberName.charAt(0) : '?',
            bg: theme.bg,
            text: theme.text,
            isCompleted: member.isCompleted || false,
          };
        });
        setMembers(mappedMembers);

      } catch (error) {
        console.error('그룹 현황 조회 실패:', error);
        useFallbackData(); // 통신 실패 시 가짜 데이터 렌더링
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupStatus();
    }
  }, [groupId, authLoading, accessToken]);

  // 완료한 인원수 계산
  const completedCount = members.filter(m => m.isCompleted).length;

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden px-5 py-6">
      
      {/* 헤더 영역 (고정) */}
      <div className="flex items-center mb-8 mt-2 shrink-0">
        <button 
          onClick={() => router.back()} 
          className="text-[20px] font-bold text-[#A0A0A0] mr-3"
        >
          ←
        </button>
        <h1 className="text-[22px] font-bold text-[#000000]">
          그룹 완료 현황
        </h1>
      </div>

      {isLoading ? (
        // 로딩 화면
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-10 h-10 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#666666] font-semibold text-[14px]">현황을 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          {/* 요약 텍스트 영역 */}
          <div className="flex items-center justify-between mb-4 px-1 shrink-0">
            <span className="text-[14px] text-[#666666] font-medium">오늘의 미션 현황</span>
            <span className="text-[14px] font-bold text-[#41C0A1]">
              {completedCount} / {members.length}명 완료
            </span>
          </div>

          {/* 멤버 리스트 영역 */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-3 w-full pb-4">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="w-full bg-[#F7F7F7] p-[10px] rounded-[20px] flex items-center justify-between shrink-0"
              >

                <div className="flex items-center gap-4">
                  <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 ${member.bg}`}>
                    <span className={`text-[18px] font-bold ${member.text}`}>
                      {member.initial}
                    </span>
                  </div>
                  <span className="text-[16px] font-bold text-[#222222]">
                    {member.name}
                  </span>
                </div>

                <div className="shrink-0 pr-2">
                  {member.isCompleted ? (
                    <svg 
                      className="w-8 h-8 text-[#222222]" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3.5" 
                      viewBox="0 0 24 24" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[13px] text-[#B0B0B0] font-semibold pr-1">
                      미완료
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 하단 버튼 영역 */}
      <div className="w-full mt-auto shrink-0 pt-4 border-t border-transparent">
        <button
          onClick={() => router.push(`/fe-e/group/${groupId}`)}
          className="w-full py-[14px] rounded-[16px] font-semibold text-[16px] text-black bg-[#A7FBE7] hover:bg-[#92edd8] transition-colors"
        >
          완료
        </button>
      </div>

    </div>
  );
}