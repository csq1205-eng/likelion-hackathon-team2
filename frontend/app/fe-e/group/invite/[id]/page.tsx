// src/app/fe-e/group/invite/[id]/page.tsx
'use client';

import { Span } from 'next/dist/trace';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JoinCheck() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id;

  const [isLogin, setIsLogin] = useState(true); // 테스트용
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!isLogin) {
      alert("로그인이 필요합니다! 로그인 화면으로 이동합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/groups/join`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
      });

      const result = await response.json();

      if (result.success) {
        alert('그룹에 성공적으로 참여했습니다!');
        router.push(`/fe-e/group/${groupId}`); // 참여 완료 후 해당 그룹 피드로 이동
      } else {
        alert(result.message || '그룹 참여에 실패했습니다.');
      }
    } catch (error) {
        console.error('그룹 참여 실패:', error);
        alert('서버와의 통신에 실패했습니다.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleInvite = async (type: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/invite`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json' 
        },
      });
      
      const result = await response.json();

      if (result.success) {
        // 성공적으로 초대 데이터(링크, QR 이미지 URL 등)를 받아왔을 때
        console.log(`${type} 초대 발급 성공:`, result.data);
      } else {
        alert(result.message || `초대 발급에 실패했습니다.`);
      }
    } catch (error) {
      console.error('초대 발급 실패:', error);
      alert('서버와의 통신에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6 overflow-y-auto">
      <button 
        onClick={() => router.back()} 
        className="text-[14px] font-bold text-[#555555] self-start mb-2"
      >
        ←
      </button>
      <h1 className="text-[15px] text-[#000000] font-semibold mt-4 mb-4">
        함께할 그룹을 정해주세요
      </h1>

      <div className="flex flex-row items-center w-full gap-[10px] mb-10">
        <button
          onClick={() => router.push('/fe-e/group/invite/{groupId}/create')}
          className="flex flex-col items-center justify-center bg-[#F7F8F8] text-[#000000] px-[10px] py-[20px] w-[120px] h-[96px] rounded-[10px] text-[15px] font-semibold"
        >
          <img src="/Icon_Plus.svg" alt="그룹 아이콘" className="w-[40px] h-[40px] mb-2 object-contain" />
          <span className="text-[14px] font-semibold">그룹 만들기</span>
        </button>
        <button
          onClick={() => router.push(`/fe-e/group/join/${groupId}`)}
          className="flex flex-col items-center justify-center bg-[#F7F8F8] text-[#000000] px-[10px] py-[20px] w-[120px] h-[96px] rounded-[10px] text-[15px] font-semibold"
        >
          <img src="/Icon_Link.svg" alt="초대코드 아이콘" className="w-[30px] h-[30px] mt-[5px] mb-[10px] object-contain" />
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