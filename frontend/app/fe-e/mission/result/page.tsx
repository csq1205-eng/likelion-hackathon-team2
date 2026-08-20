'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest, API_B_URL } from "@/lib/api/client";

interface AIResultResponse {
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: 'PASS' | 'FAIL' | 'HOLD' | 'ERROR';
  reason?: string;
}

function MissionResultInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clipId = searchParams.get('clipId') || '1';

  const retryCountParam = searchParams.get('retryCount');
  const retryCount = retryCountParam ? parseInt(retryCountParam, 10) : 2;

  const { accessToken } = useAuth();

  const [isSuccess, setIsSuccess] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [failReason, setFailReason] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let pollingInterval: NodeJS.Timeout;

    const fetchResult = async () => {
      try {
        const res = await apiRequest<AIResultResponse>(`/clips/${clipId}/result`, {
          method: 'GET',
          accessToken,
          customBaseUrl: API_B_URL, 
        });

        // PROCESSING : 상태 유지, 다음 폴링 기다림
        if (res.status === 'REQUESTED' || res.status === 'PROCESSING') {
          console.log('AI가 아직 판정 중입니다...');
          return; 
        }

        // COMPLETED 또는 FAILED : 폴링 멈춤
        clearInterval(pollingInterval);
        setIsLoading(false);

        // 결과에 따라 상태 업데이트
        if (res.result === 'PASS') {
          setIsSuccess(true);
        } else {
          setIsSuccess(false);
          // 실패 사유가 있다면 저장
          if (res.reason) {
            setFailReason(res.reason);
          }
        }
      } catch (error) {
        console.error('판정 결과 조회 실패:', error);
        clearInterval(pollingInterval);
        setIsLoading(false);
        setIsSuccess(false);
        setFailReason("서버와의 연결에 실패했습니다.");
      }
    };

    fetchResult();
    pollingInterval = setInterval(fetchResult, 2000);

    return () => clearInterval(pollingInterval);
  }, [clipId, accessToken]);

  // 로딩(판정 중) 화면
  if (isLoading) {
    return (
      <div className="relative w-full h-[100dvh] bg-white flex flex-col items-center justify-center overflow-hidden px-5 py-6">
        <div className="w-12 h-12 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-[18px] font-bold text-[#000000] mb-2">
          AI가 판정 중이에요
        </h1>
        <p className="text-[14px] text-[#666666] font-medium text-center">
          잠시만 기다려주세요...
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full h-[100dvh] relative bg-white px-5 py-6 overflow-hidden">

      {/* 개발용 임시 버튼 (실제 서비스 시 삭제 필요)
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={() => setIsSuccess(!isSuccess)}
          className="absolute top-4 right-4 bg-gray-200 text-xs px-2 py-1 rounded z-50"
        >
          상태 전환 테스트 (현재: {isSuccess ? '성공' : '실패'})
        </button>
      )}*/}

      <div className="flex flex-col items-center justify-center flex-1 w-full pb-[40px]">
        {isSuccess ? (
          <>
            <div className="w-[60px] h-[60px] rounded-full bg-[#EAF9F4] flex items-center justify-center text-[#41C0A1] mb-5 shadow-inner">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>

            <h1 className="text-[24px] font-bold text-[#000000] mb-3 text-center">
              미션 완료!
            </h1>
            <p className="text-[15px] text-[#666666] font-medium text-center">
              미션 수행이 확인됐어요
            </p>
          </>
        ) : (
          // ================= [ 판정 실패 (재촬영) 화면 ] =================
          <>
            <div className="w-[60px] h-[60px] rounded-full bg-[#FFF3F3] flex items-center justify-center text-[#FF5C5C] mb-5 shadow-inner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <h1 className="text-[24px] font-bold text-[#000000] mb-3 text-center">
              다시 촬영해주세요
            </h1>
            <p className="text-[15px] text-[#666666] font-medium text-center leading-relaxed">
              미션과 관련된 장면이 확인되지 않았어요<br />
              (재시도 {retryCount}회 남음)
            </p>

            {failReason && (
              <div className="w-[250px] bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl p-3 text-center mt-[16px]">
                <p className="text-[13px] text-[#FF5C5C] font-medium">
                  {failReason}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-full mt-auto shrink-0 pb-2 pt-4">
        {isSuccess ? (
          <button
            onClick={() => router.push(`/fe-e/mission/share?clipId=${clipId}`)}
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

export default function MissionResultPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <MissionResultInner />
    </Suspense>
  );
}