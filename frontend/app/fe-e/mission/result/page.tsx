'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MissionResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const missionId = searchParams.get('missionId') || '1';

  const [isSuccess, setIsSuccess] = useState(false); 
  const [retryCount, setRetryCount] = useState(2);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/clips/{clipId}/result`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        // PROCESSING : 상태 유지, 다음 폴링 기다림
        if (result.status === 'PROCESSING') {
          console.log('AI가 아직 판정 중입니다...');
          return; 
        }

        // SUCCESS or FAIL : 폴링 멈춤
        clearInterval(pollingInterval);
        setIsLoading(false);

        // 결과에 따라 상태 업데이트
        if (result.success && result.data.isPassed) {
          setIsSuccess(true);
        } else {
          setIsSuccess(false);
          // 백엔드에서 내려주는 남은 재시도 횟수 세팅
          setRetryCount(result.data.remainRetryCount ?? 2);
        }
      } catch (error) {
        console.error('판정 결과 조회 실패:', error);
        // 에러 발생 시 임시로 폴링을 중단하고 실패 화면(또는 에러 화면) 표시
        clearInterval(pollingInterval);
        setIsLoading(false);
        setIsSuccess(false);
      }
    };

    // 1. 컴포넌트 마운트 시 최초 1회 실행
    fetchResult();

    // 2. 이후 2초(2000ms)마다 주기적으로 API 재요청 (폴링 기준)
    pollingInterval = setInterval(fetchResult, 2000);

    // 컴포넌트 언마운트 시 인터벌 정리 (메모리 누수 방지)
    return () => clearInterval(pollingInterval);
  }, [missionId]);

  // 로딩(판정 중) 화면
  if (isLoading) {
    return (
      <div className="relative w-full h-[100dvh] bg-white flex flex-col items-center justify-center overflow-hidden px-5 py-6">
        <div className="w-12 h-12 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-[18px] font-bold text-[#000000] mb-2">
          AI가 판정 중이에요
        </h1>
        <p className="text-[14px] text-[#888888] font-medium text-center">
          잠시만 기다려주세요...
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full h-[100dvh] relative bg-white px-5 py-6 overflow-hidden">

      {/* 개발용 임시 버튼 (실제 서비스 시 삭제 필요) */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={() => setIsSuccess(!isSuccess)}
          className="absolute top-4 right-4 bg-gray-200 text-xs px-2 py-1 rounded z-50"
        >
          상태 전환 테스트 (현재: {isSuccess ? '성공' : '실패'})
        </button>
      )}

      <div className="flex flex-col items-center justify-center flex-1 w-full pb-[40px]">
        {isSuccess ? (
          <>
            <svg 
              className="w-[100px] h-[100px] mb-8 text-[#222222]" 
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

            <h1 className="text-[24px] font-bold text-[#000000] mb-3 text-center">
              미션 완료!
            </h1>
            <p className="text-[15px] text-[#888888] font-medium text-center">
              미션 수행이 확인됐어요
            </p>
          </>
        ) : (
          // ================= [ 판정 실패 (재촬영) 화면 ] =================
          <>
            <svg 
              className="w-[120px] h-[120px] mb-8" 
              viewBox="0 0 120 120" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M60 15L15 95H105L60 15Z" fill="#FF4D4D"/>
              <rect x="56" y="45" width="8" height="24" rx="4" fill="white"/>
              <circle cx="60" cy="80" r="5" fill="white"/>
            </svg>

            <h1 className="text-[24px] font-bold text-[#000000] mb-3 text-center">
              다시 촬영해주세요
            </h1>
            <p className="text-[15px] text-[#888888] font-medium text-center leading-relaxed">
              미션과 관련된 장면이 확인되지 않았어요<br />
              (재시도 {retryCount}회 남음)
            </p>
          </>
        )}
      </div>

      <div className="w-full mt-auto shrink-0 pb-2 pt-4">
        {isSuccess ? (
          <button
            onClick={() => router.push('/mission/share')}
            className="w-full py-[16px] rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors"
          >
            확인
          </button>
        ) : (
          <button
            onClick={() => router.back()}
            className="w-full py-[16px] rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors"
          >
            재촬영하기
          </button>
        )}
      </div>

    </div>
  );
}