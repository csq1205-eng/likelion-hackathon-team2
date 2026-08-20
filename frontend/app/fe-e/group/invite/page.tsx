// src/app/fe-e/group/invite/[id]/page.tsx
'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/api/client";

export default function JoinCheck() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!accessToken) {
      alert("로그인이 필요합니다! 로그인 화면으로 이동합니다.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      await apiRequest(`/groups/join`, { 
        method: 'POST',
        body: { inviteCode: groupId },
        accessToken,
      });

      alert('그룹에 성공적으로 참여했습니다!');
      localStorage.setItem('myGroupId', String(groupId));
      router.push(`/fe-e/group/${groupId}`);

    } catch (error) {
        console.error('그룹 참여 실패:', error);
        alert('그룹 참여에 실패했습니다.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleInvite = async (type: string) => {
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const data = await apiRequest<unknown>(`/groups/${groupId}/invite`, { 
        method: 'GET',
        accessToken,
      });
      
      console.log(`${type} 초대 발급 성공:`, data);
      alert(`${type.toUpperCase()} 초대 정보가 발급되었습니다!`);

    } catch (error) {
      console.error('초대 발급 실패:', error);
      alert('초대 발급에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-[100dvh] sm:h-[100dvh] bg-[#F7F8F8] sm:px-4 sm:py-6 flex items-center justify-center sm:overflow-hidden">
      <div className="mx-auto flex w-full min-h-[100dvh] sm:min-h-0 sm:h-[740px] max-w-none sm:max-w-sm flex-col sm:rounded-3xl bg-white px-6 py-6 sm:shadow-[0_8px_30px_rgba(31,42,37,0.06)] overflow-hidden">
        
        <button 
            onClick={() => router.back()} 
            className="mb-2 text-[#A0A0A0] w-fit hover:opacity-70 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        <h1 className="text-[15px] text-[#000000] font-semibold mt-4 mb-4">
          함께할 그룹을 정해주세요
        </h1>

        <div className="flex flex-row items-center w-full gap-3 mb-10">
          <button
            onClick={() => router.push(`/fe-e/group/create`)}
            className="flex-1 flex flex-col items-center justify-center bg-[#F7F8F8] text-[#000000] px-3 py-5 h-[96px] rounded-[14px] text-[15px] font-semibold hover:bg-[#EFEFEF] transition-colors"
          >
            <Image 
              src="/Icon_Plus.svg" 
              alt="그룹 아이콘" 
              width={36} 
              height={36} 
              className="mb-2 object-contain" 
            />
            <span className="text-[13px] font-semibold">그룹 만들기</span>
          </button>

          <button
            onClick={() => router.push(`/fe-e/group/join`)}
            className="flex-1 flex flex-col items-center justify-center bg-[#F7F8F8] text-[#000000] px-3 py-5 h-[96px] rounded-[14px] text-[15px] font-semibold hover:bg-[#EFEFEF] transition-colors"
          >
            <Image 
              src="/Icon_Link.svg" 
              alt="초대코드 아이콘" 
              width={28} 
              height={28} 
              className="mt-[2px] mb-[8px] object-contain" 
            />
            <span className="text-[13px] font-semibold">초대코드로 참여</span>
          </button>
        </div>
        
        <h1 className="text-[15px] text-[#000000] font-semibold mt-4 mb-4">
            그룹 초대하기   
        </h1>
        
        <div className="flex flex-row items-center w-full gap-2">
          <button
            onClick={() => handleInvite('kakao')}
            className="flex-1 bg-[#F7F8F8] text-[#000000] h-[42px] rounded-[10px] text-[14px] font-semibold hover:bg-[#EFEFEF] transition-colors"
          >
            카카오톡
          </button>
          <button
            onClick={() => handleInvite('url')}
            className="flex-1 bg-[#F7F8F8] text-[#000000] h-[42px] rounded-[10px] text-[14px] font-semibold hover:bg-[#EFEFEF] transition-colors"
          >
            URL
          </button>
          <button
            onClick={() => handleInvite('qr')}
            className="flex-1 bg-[#F7F8F8] text-[#000000] h-[42px] rounded-[10px] text-[14px] font-semibold hover:bg-[#EFEFEF] transition-colors"
          >
            QR
          </button>
        </div>
      </div>
    </main>

  );     
}