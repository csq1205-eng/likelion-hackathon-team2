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
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6 overflow-y-auto">
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

      <div className="flex flex-row items-center w-full gap-[10px] mb-10">
        <button
          onClick={() => router.push(`/fe-e/group/create`)}
          className="flex flex-col items-center justify-center bg-[#F7F8F8] text-[#000000] px-[10px] py-[20px] w-[120px] h-[96px] rounded-[10px] text-[15px] font-semibold"
        >
          <Image 
            src="/Icon_Plus.svg" 
            alt="그룹 아이콘" 
            width={40} 
            height={40} 
            className="mb-2 object-contain" 
          />
          <span className="text-[14px] font-semibold">그룹 만들기</span>
        </button>
        <button
          onClick={() => router.push(`/fe-e/group/join`)}
          className="flex flex-col items-center justify-center bg-[#F7F8F8] text-[#000000] px-[10px] py-[20px] w-[120px] h-[96px] rounded-[10px] text-[15px] font-semibold"
        >
          <Image 
            src="/Icon_Link.svg" 
            alt="초대코드 아이콘" 
            width={30} 
            height={30} 
            className="mt-[5px] mb-[10px] object-contain" 
          />
          <span className="text-[14px] font-semibold mt-[2px]">초대코드로 참여</span>
        </button>
      </div>

      <h1 className="text-[15px] text-[#000000] font-semibold mt-4 mb-4">
          그룹 초대하기   
      </h1>
      
      <div className="flex flex-row items-center w-full gap-2">
        <button
          onClick={() => handleInvite('kakao')}
          className="bg-[#F7F8F8] text-[#000000] w-[80px] h-[37px] rounded-[10px] text-[14px] font-semibold"
        >
          카카오톡
        </button>
        <button
          onClick={() => handleInvite('url')}
          className="bg-[#F7F8F8] text-[#000000] w-[80px] h-[37px] rounded-[10px] text-[14px] font-semibold"
        >
          URL
        </button>
        <button
          onClick={() => handleInvite('qr')}
          className="bg-[#F7F8F8] text-[#000000] w-[80px] h-[37px] rounded-[10px] text-[14px] font-semibold"
        >
          QR
        </button>
      </div>
    </div>

  );     
}