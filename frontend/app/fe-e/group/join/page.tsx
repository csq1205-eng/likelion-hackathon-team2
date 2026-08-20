// src/app/fe-e/group/join/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/auth/AuthProvider";

export default function GroupCodeJoinPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [inviteCode, setInviteCode] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      alert("로그인이 필요합니다!");
      return;
    }

    if (!inviteCode.trim()) {
      alert("초대 코드를 입력해주세요.");
      return;
    }

    router.push(`/fe-e/group/join/${inviteCode.trim()}`);
  };

  return (
    <div className="w-full h-[100dvh] bg-white flex flex-col justify-between px-5 py-6 overflow-hidden">
      
      {/* 상단 영역 */}
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
          그룹 참여
        </span>
        <h1 className="text-[20px] text-[#000000] font-bold mt-1 mb-2">
          초대 코드를 입력해주세요
        </h1>
        <p className="text-[13px] text-[#888888] font-medium mb-6">
          그룹 장에게 받은 초대 코드를 입력하면 그룹에 참여할 수 있어요.
        </p>

        {/* 코드 입력 폼 */}
        <form onSubmit={handleNext} className="flex flex-col gap-4">
          <input 
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="초대 코드를 입력하세요 (예: A1B2C3D4)"
            className="w-full px-4 py-3.5 rounded-[14px] bg-[#F7F8F8] text-[15px] text-black outline-none border border-transparent focus:border-[#41C0A1] transition-colors"
          />

          <button
            type="submit"
            className="w-full py-[15px] rounded-[14px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors shadow-sm"
          >
            다음
          </button>
        </form>
      </div>

      {/* 하단 여백용 */}
      <div className="pb-4"></div>
    </div>
  );
}