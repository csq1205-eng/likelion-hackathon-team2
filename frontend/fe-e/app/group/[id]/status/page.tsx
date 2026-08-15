'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GroupStatusPage() {
  const router = useRouter();

  // 임시 멤버 완료 현황 데이터 (클립은 비공개이므로 완료 여부 boolean 값만 가짐)
  const [members] = useState([
    { id: 1, name: '프로필A', initial: 'A', bg: 'bg-[#EAF9F4]', text: 'text-[#50C2A4]', isCompleted: true },
    { id: 2, name: '프로필B', initial: 'B', bg: 'bg-[#F3EDFB]', text: 'text-[#9884D2]', isCompleted: true },
    { id: 3, name: '프로필C', initial: 'C', bg: 'bg-[#FFF3E0]', text: 'text-[#FFB74D]', isCompleted: true },
    { id: 4, name: '프로필D', initial: 'D', bg: 'bg-[#F0F0F0]', text: 'text-[#A0A0A0]', isCompleted: false }, // 미완료자
  ]);

  // 완료한 인원수 계산
  const completedCount = members.filter(m => m.isCompleted).length;

  return (
    <div className="flex flex-col w-full min-h-screen bg-white px-5 py-6 relative">
      
      {/* 헤더 영역 */}
      <div className="flex items-center mb-8 mt-2">
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

      {/* 요약 텍스트 영역 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[14px] text-[#888888] font-medium">오늘의 미션 현황</span>
        <span className="text-[14px] font-bold text-[#41C0A1]">
          {completedCount} / {members.length}명 완료
        </span>
      </div>

      {/* 멤버 리스트 영역 */}
      <div className="flex flex-col gap-3 w-full">
        {members.map((member) => (
          <div 
            key={member.id} 
            className="w-full bg-[#F7F7F7] p-[10px] rounded-[20px] flex items-center justify-between"
          >
            {/* 좌측: 프로필 이미지 + 이름 */}
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

            {/* 우측: 완료 상태 표시 (체크마크 or 미완료 텍스트) */}
            <div className="shrink-0 pr-2">
              {member.isCompleted ? (
                // 완료된 경우: 시안처럼 굵은 검은색 체크마크
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
                // 미완료인 경우: 연한 텍스트로 처리
                <span className="text-[13px] text-[#B0B0B0] font-semibold pr-1">
                  미완료
                </span>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={() => router.push(`/group`)}
          className="mt-auto w-full py-[14px] rounded-[12px] font-semibold text-[16px] text-black bg-[#A7FBE7] hover:bg-[#92edd8] transition-colors shrink-0"
        >
          완료
        </button>
      </div>

    </div>
  );
}