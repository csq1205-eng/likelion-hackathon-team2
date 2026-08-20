// src/app/fe-e/group/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/api/client";

export default function GroupCreatePage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [name, setName] = useState('');
  const [goalName, setGoalName] = useState('');
  const [targetDays, setTargetDays] = useState(21);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!name.trim() || !goalName.trim()) {
      alert('그룹 이름과 목표를 모두 입력해주세요!');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<any>('/groups', {
        method: 'POST',
        accessToken,
        body: {
          name,
          goalName,
          targetDays: Number(targetDays),
        },
      });

      // 백엔드 응답에서 groupId와 inviteCode 추출 (이미지 명세 기준)
      const groupData = response.data || response;
      const newGroupId = groupData.groupId;
      const inviteCode = groupData.inviteCode;

      if (inviteCode) {
        localStorage.setItem('lastInviteCode', inviteCode);
      }
      if (newGroupId) {
        localStorage.setItem('myGroupId', String(newGroupId));
      }

      alert('그룹이 성공적으로 생성되었습니다!');
      
      // 생성된 그룹의 초대장 생성 페이지로 이동
      router.push(`/fe-e/group/invite/${newGroupId}/create`);

    } catch (error) {
      console.error('그룹 생성 실패:', error);
      alert('그룹 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-white flex flex-col justify-between px-5 py-6 overflow-hidden">
      <div className="flex flex-col w-full">
        <button 
          onClick={() => router.back()} 
          className="mb-4 text-[#A0A0A0] w-fit hover:opacity-70 transition-opacity"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <span className="text-[15px] text-[#666666] font-semibold">
          그룹 만들기
        </span>
        <h1 className="text-[20px] text-[#000000] font-bold mt-1 mb-6">
          함께할 그룹의 정보를 입력해주세요
        </h1>

        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#333]">그룹 이름</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 아침 루틴 챌린지"
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#F7F8F8] text-[15px] text-black outline-none border border-transparent focus:border-[#41C0A1]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#333]">목표 이름</label>
            <input 
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="예: 21일 ₩ 정원 완성"
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#F7F8F8] text-[15px] text-black outline-none border border-transparent focus:border-[#41C0A1]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#333]">목표 기간 (일)</label>
            <input 
              type="number"
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              placeholder="21"
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#F7F8F8] text-[15px] text-black outline-none border border-transparent focus:border-[#41C0A1]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-[15px] rounded-[14px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors shadow-sm mt-4 disabled:opacity-50"
          >
            {isSubmitting ? '그룹 만드는 중...' : '그룹 생성하고 초대하기'}
          </button>
        </form>
      </div>

      <div className="pb-4"></div>
    </div>
  );
}