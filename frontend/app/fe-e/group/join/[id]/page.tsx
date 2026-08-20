'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/api/client";

export default function GroupJoinPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const { accessToken } = useAuth();

  // 임시 그룹 데이터 (API에서 받아올 데이터 구조)
  const [groupData, setGroupData] = useState({
    name: '',
    memberCount: 0,
    members: [] as { id: number, name: string, initial: string, bg: string, text: string }[]
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyFallbackData = () => {
    console.log("통신 실패! 임시 테스트 데이터를 띄웁니다.");
    setGroupData({
      name: '내 친구들',
      memberCount: 2,
      members: [
        { id: 1, name: '민지', initial: '민', bg: 'bg-[#EAF9F4]', text: 'text-[#50C2A4]' },
        { id: 2, name: '서연', initial: '서', bg: 'bg-[#F3EDFB]', text: 'text-[#9884D2]' },
      ]
    });
  };

  useEffect(() => {
    const fetchGroupPreview = async () => {
      try {
        const data = await apiRequest<any>(`/groups/invite/preview?inviteCode=${groupId}`, {
          method: 'GET',
        });

        setGroupData(data);
      } catch (error) {
        console.error('그룹 정보 불러오기 실패:', error);
        applyFallbackData(); // 통신 실패 시 임시 데이터 사용
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupPreview();
    }
  }, [groupId]);

  const handleJoin = async () => {
    if (!accessToken) {
      alert('로그인이 필요한 서비스입니다.');
      // router.push('/fe-d/login');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await apiRequest(`/groups/join`, {
        method: 'POST',
        body: { inviteCode: groupId },
        accessToken,
      });

      alert('그룹에 성공적으로 참여했습니다!');
      router.push(`/fe-e/group/${groupId}`);

    } catch (error) {
      console.error('API Error:', error);
      alert('그룹 참여에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginAndJoin = () => {
    alert('로그인 페이지로 이동합니다.');
    // router.push('/fe-d/login'); 
  };

  return (
    <div className="w-full h-[100dvh] bg-white flex flex-col overflow-hidden px-5 py-6">
      
      {/* 상단 헤더 영역 */}
      <div className="flex flex-col shrink-0">
        <button 
          onClick={() => router.back()} 
          className="mb-2 text-[#A0A0A0] w-fit hover:opacity-70 transition-opacity"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h3 className="text-[15px] text-[#666666] font-semibold mb-2">
          그룹 참여
        </h3>
      </div>

      {isLoading ? (
        // 로딩 화면
        <div className="flex flex-col items-center justify-center flex-1 min-h-0">
          <div className="w-10 h-10 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#666666] font-semibold text-[14px]">그룹 정보를 불러오고 있어요...</p>
        </div>
      ) : (
        // 중앙 컨텐츠 영역
        <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0">
          
          <div className="w-[70px] h-[70px] rounded-full bg-[#EAF9F4] flex items-center justify-center mb-5 shrink-0">
            <span className="text-[32px] font-bold text-[#50C2A4]">
              {groupData.name ? groupData.name.charAt(0) : '우'}
            </span>
          </div>

          <h1 className="text-[22px] font-bold text-[#000000] mb-1 text-center shrink-0">
            {groupData.name}
          </h1>
          <p className="text-[14px] text-[#666666] font-medium mb-6 shrink-0">
            그룹에 참여하시겠어요?
          </p>

          <div className="flex flex-row items-center justify-center gap-[10px] mb-5 shrink-0 flex-wrap">
            {groupData.members.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-[4px]">
                <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center ${member.bg || 'bg-[#EAF9F4]'}`}>
                  <span className={`text-[16px] font-bold ${member.text || 'text-[#50C2A4]'}`}>
                    {member.initial}
                  </span>
                </div>
                <span className="text-[11px] text-[#666666] font-medium">
                  {member.name}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-[#A0A0A0] font-medium shrink-0">
            이미 {groupData.memberCount}명이 함께하고 있어요
          </p>
        </div>
      )}

      {/* 하단 버튼 영역 */}
      {!isLoading && (
        <div className="flex flex-col w-full gap-[10px] shrink-0 pt-4">
          <button
            onClick={handleJoin}
            disabled={isLoading || isSubmitting}
            className="w-full py-[14px] rounded-[12px] bg-[#A7FBE7] text-[#000000] font-semibold text-[16px] hover:bg-[#92edd8] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '참여 하는중...' : '참여하기'}
          </button>
          <button
            onClick={handleLoginAndJoin}
            className="w-full py-[14px] rounded-[12px] bg-[#F7F8F8] text-[#9CA3AF] font-semibold text-[16px] hover:bg-[#E8E8E8] transition-colors disabled:opacity-50"
          >
            로그인 후 참여할게요
          </button>
        </div>
      )}

    </div> 
  );
}