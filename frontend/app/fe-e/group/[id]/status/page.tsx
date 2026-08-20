'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { apiRequest } from '@/lib/api/client';

interface StatusMemberDTO {
  memberId: number;
  memberName: string;
  isCompleted: boolean;
}

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
  isMe: boolean;
}

export default function GroupStatusPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string || (typeof window !== 'undefined' ? localStorage.getItem('myGroupId') : '1');

  const { accessToken, userId, isLoading: authLoading } = useAuth();

  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyFallbackData = () => {
    console.log("통신 실패 또는 비로그인 상태! 임시 테스트 데이터를 띄웁니다.");
    setMembers([
      { id: 1, name: '프로필A', initial: 'A', bg: 'bg-[#EAF9F4]', text: 'text-[#50C2A4]', isCompleted: true, isMe: true }, // 💡 프로필A를 나로 설정
      { id: 2, name: '프로필B', initial: 'B', bg: 'bg-[#F3EDFB]', text: 'text-[#9884D2]', isCompleted: true, isMe: false },
      { id: 3, name: '프로필C', initial: 'C', bg: 'bg-[#FFF3E0]', text: 'text-[#FFB74D]', isCompleted: true, isMe: false },
      { id: 4, name: '프로필D', initial: 'D', bg: 'bg-[#F0F0F0]', text: 'text-[#A0A0A0]', isCompleted: false, isMe: false },
    ]);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      applyFallbackData();
      setIsLoading(false);
      return;
    }

    const fetchGroupStatus = async () => {
      try {
        const result = await apiRequest<StatusMemberDTO[]>(`/groups/${groupId}/status`, {
          accessToken,
        });

        const rawData = Array.isArray(result) ? result : (result as any).data || result;
        
        const mappedMembers = rawData.map((member: StatusMemberDTO, index: number) => {
          const theme = THEMES[index % THEMES.length];
          const memberName = member.memberName || '알 수 없음';
          
          // 현재 로그인된 userId와 member.memberId가 같을 경우 본인으로 판정 (비교 불가 시 첫 번째 멤버를 나로 설정)
          const isMe = userId ? member.memberId === Number(userId) : index === 0; 
          
          return {
            id: member.memberId || index,
            name: memberName,
            initial: memberName.charAt(0),
            bg: theme.bg,
            text: theme.text,
            isCompleted: member.isCompleted || false,
            isMe,
          };
        });
        setMembers(mappedMembers);

      } catch (error) {
        console.error('그룹 현황 조회 실패:', error);
        applyFallbackData();
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupStatus();
    }
  }, [groupId, authLoading, accessToken, userId]);

  // 완료한 인원수 계산
  const completedCount = members.filter(m => m.isCompleted).length;
  
  return (
    <main className="w-full h-[100dvh] bg-[#F7F8F8] sm:px-4 sm:py-6 flex items-center justify-center sm:overflow-hidden">
      <div className="mx-auto flex w-full h-full sm:h-[740px] max-w-none sm:max-w-sm flex-col sm:rounded-3xl bg-white px-6 py-6 sm:shadow-[0_8px_30px_rgba(31,42,37,0.06)] overflow-hidden justify-between relative pb-[80px]">
        
        {/* 상단 헤더 영역 */}
        <div className="bg-white px-6 py-5 flex items-center shrink-0 z-10">
          <button onClick={() => router.back()} className="text-[22px] font-bold text-[#A0A0A0] mr-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[18px] font-bold text-[#000000]">
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
          <div className="flex-1 flex flex-col overflow-hidden py-2">
            {/* 요약 텍스트 영역 */}
            <div className="flex items-center justify-between mb-3 px-1 shrink-0">
              <span className="text-[14px] text-[#666666] font-medium">오늘의 미션 현황</span>
              <span className="text-[14px] font-bold text-[#41C0A1]">
                {completedCount} / {members.length}명 완료
              </span>
            </div>

            {/* 멤버 리스트 영역 */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-2.5 w-full pr-1">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className={`w-full p-[10px] rounded-[20px] flex items-center justify-between shrink-0 transition-all ${
                    member.isMe ? 'bg-[#EAF9F4] border-[1.5px] border-[#41C0A1]' : 'bg-[#F7F7F7] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 ${member.bg}`}>
                      <span className={`text-[17px] font-bold ${member.text}`}>
                        {member.initial}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#222222]">
                        {member.name}
                      </span>
                      {member.isMe && (
                        <span className="bg-[#41C0A1] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                          나
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pr-2">
                    {member.isCompleted ? (
                      <div className="flex items-center justify-center w-7 h-7 bg-[#222222] rounded-full shadow-sm">
                        <svg 
                          className="w-4 h-4 text-[#ffffff]" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3.5" 
                          viewBox="0 0 24 24" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M5 12l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#B0B0B0] font-semibold pr-1">
                        미완료
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 버튼 영역 */}
        <div className="w-full shrink-0 pt-3">
          <button
            onClick={() => router.push(`/fe-e/group/${groupId}`)}
            className="w-full mb-[14px] py-[14px] rounded-[16px] font-semibold text-[15px] text-black bg-[#A7FBE7] hover:bg-[#92edd8] transition-colors shadow-sm"
          >
            확인
          </button>
        </div>

        {/* 하단 탭 바 */}
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-3 pb-4 z-50 shrink-0">
          <TabIcon icon="users" label="그룹" isActive onClick={() => router.push('/fe-e/group')} />
          <TabIcon icon="check" label="미션" onClick={() => router.push('/fe-d/mission')} />
          <TabIcon icon="leaf" label="W 정원" onClick={() => router.push(`/fe-d/${groupId}/garden`)} />
          <TabIcon icon="bar-chart" label="기록" onClick={() => router.push('/fe-e/record/report')} />
        </div>

      </div>
    </main>
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