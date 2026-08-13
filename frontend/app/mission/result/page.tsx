'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MissionResultPage() {
  const router = useRouter();
  
  // 💡 API 연동 후에는 이 상태를 백엔드 응답 결과에 따라 true/false로 설정해주시면 됩니다.
  const [isSuccess, setIsSuccess] = useState(false); 
  const retryCount = 2; // 남은 재시도 횟수

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6">
      
      {/* 개발용 임시 버튼 (실제 서비스 시 삭제 필요) */}
      <button 
        onClick={() => setIsSuccess(!isSuccess)}
        className="absolute top-4 right-4 bg-gray-200 text-xs px-2 py-1 rounded"
      >
        상태 전환 테스트 (현재: {isSuccess ? '성공' : '실패'})
      </button>

  
      {isSuccess ? (
        // ================= [ 미션 완료 (성공) 화면 ] =================
        <div className="flex flex-col items-center w-full">
          {/* 성공 아이콘 (검은색 체크 원형) */}
          <svg 
            className="w-[100px] h-[100px] mt-[100px] mb-8 text-[#222222]" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            viewBox="0 0 100 100"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="50" cy="50" r="36" />
            <path d="M32 50l12 12 24-24" />
          </svg>

          <h1 className="text-[24px] font-bold text-[#000000] mb-3">
            미션 완료!
          </h1>
          <p className="text-[15px] text-[#888888] font-medium mb-12">
            미션 수행이 확인됐어요
          </p>

          <div className="w-full mt-10">
            <button
              onClick={() => router.push('/mission/share')}
              className="w-full py-[16px] rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors"
            >
              확인
            </button>
          </div>
        </div>

      ) : (
        // ================= [ 판정 실패 (재촬영) 화면 ] =================
        <div className="flex flex-col items-center w-full">
          <svg 
            className="w-[120px] h-[120px] mt-[100px] mb-8" 
            viewBox="0 0 120 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M60 15L15 95H105L60 15Z" fill="#FF4D4D"/>
            <rect x="56" y="45" width="8" height="24" rx="4" fill="white"/>
            <circle cx="60" cy="80" r="5" fill="white"/>
          </svg>

          <h1 className="text-[24px] font-bold text-[#000000] mb-3">
            다시 촬영해주세요
          </h1>
          <p className="text-[15px] text-[#888888] font-medium text-center leading-relaxed mb-12">
            미션과 관련된 장면이 확인되지 않았어요<br />
            (재시도 {retryCount}회 남음)
          </p>

          <div className="w-full mt-4">
            <button
              onClick={() => router.back()}
              className="w-full py-[16px] rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors"
            >
              재촬영하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}