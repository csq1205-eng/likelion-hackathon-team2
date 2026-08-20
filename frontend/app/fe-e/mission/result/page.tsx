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

type ScreenMode = 'LOADING' | 'SUCCESS' | 'FAIL' | 'HOLD' | 'ERROR';

function MissionResultInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clipId = searchParams.get('clipId') || '1';

  const retryCountParam = searchParams.get('retryCount');
  const retryCount = retryCountParam ? parseInt(retryCountParam, 10) : 2;

  const { accessToken } = useAuth();

  const [screenMode, setScreenMode] = useState<ScreenMode>('LOADING');
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

        // 아직 판정 중인 경우 : 상태 유지, 다음 폴링 대기
        if (res.status === 'REQUESTED' || res.status === 'PROCESSING') {
          console.log('AI가 아직 판정 중입니다...');
          return; 
        }

        // 판정 완료 또는 실패 상태 도달 : 폴링 중지
        clearInterval(pollingInterval);

        if (res.status === 'COMPLETED') {
          if (res.result === 'PASS') {
            setScreenMode('SUCCESS');
          } else if (res.result === 'FAIL') {
            setScreenMode('FAIL');
            if (res.reason) setFailReason(res.reason);
          } else if (res.result === 'HOLD') {
            setScreenMode('HOLD');
            if (res.reason) setFailReason(res.reason);
          } else if (res.result === 'ERROR') {
            setScreenMode('ERROR');
            setFailReason(res.reason || "AI 시스템에 오류가 발생했습니다.");
          } else {
            // 결과 값이 누락되었거나 알 수 없는 경우 기본 실패 처리
            setScreenMode('FAIL');
          }
        } else {
          // status가 FAILED 등인 경우 방어 코드
          setScreenMode('ERROR');
          setFailReason("판정 처리 중 문제가 발생했습니다.");
        }

      } catch (error) {
        console.error('판정 결과 조회 실패:', error);
        clearInterval(pollingInterval);
        setScreenMode('ERROR');
        setFailReason("서버와의 연결에 실패했습니다.");
      }
    };

    fetchResult();
    pollingInterval = setInterval(fetchResult, 2000);

    return () => clearInterval(pollingInterval);
  }, [clipId, accessToken]);

  // 로딩(판정 중) 화면
  if (screenMode === 'LOADING') {
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

      <div className="flex flex-col items-center justify-center flex-1 w-full pb-[40px]">
        
        {/* 성공 (PASS) 화면 */}
        {screenMode === 'SUCCESS' && (
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
        )}

        {/* 미션 수행 실패 (FAIL) 화면 */}
        {screenMode === 'FAIL' && (
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
              <div className="w-[280px] bg-[#FFF5F5] border border-[#FFE3E3] rounded-xl p-3 text-center mt-[16px]">
                <p className="text-[13px] text-[#FF5C5C] font-medium">
                  {failReason}
                </p>
              </div>
            )}
          </>
        )}

        {/* 판정 애매 (HOLD) 화면 */}
        {screenMode === 'HOLD' && (
          <>
            <div className="w-[60px] h-[60px] rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B] mb-5 shadow-inner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className="text-[24px] font-bold text-[#000000] mb-3 text-center">
              조금 더 명확하게 보여주세요
            </h1>
            <p className="text-[15px] text-[#666666] font-medium text-center leading-relaxed">
              판정이 애매하여 정확한 확인이 어려워요<br />
              (재시도 {retryCount}회 남음)
            </p>
            {failReason && (
              <div className="w-[280px] bg-[#FEFCE8] border border-[#FEF08A] rounded-xl p-3 text-center mt-[16px]">
                <p className="text-[13px] text-[#D97706] font-medium">
                  {failReason}
                </p>
              </div>
            )}
          </>
        )}

        {/* AI 시스템 오류 (ERROR) 화면 */}
        {screenMode === 'ERROR' && (
          <>
            <div className="w-[60px] h-[60px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#4B5563] mb-5 shadow-inner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
            </div>
            <h1 className="text-[24px] font-bold text-[#000000] mb-3 text-center">
              일시적인 오류가 발생했어요
            </h1>
            <p className="text-[15px] text-[#666666] font-medium text-center leading-relaxed">
              AI 판정 시스템에 문제가 생겼습니다.<br />
              잠시 후 다시 시도해주세요.
            </p>
            {failReason && (
              <div className="w-[280px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-center mt-[16px]">
                <p className="text-[13px] text-[#4B5563] font-medium">
                  {failReason}
                </p>
              </div>
            )}
          </>
        )}

      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full mt-auto shrink-0 pb-2 pt-4">
        {screenMode === 'SUCCESS' ? (
          <button
            onClick={() => router.push(`/fe-e/mission/share?clipId=${clipId}`)}
            className="w-full py-[16px] rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors"
          >
            확인
          </button>
        ) : screenMode === 'ERROR' ? (
          <button
            onClick={() => router.push('/fe-e/mission')} // 미션 목록이나 홈으로 이동
            className="w-full py-[16px] rounded-[16px] bg-[#E5E7EB] text-[#1F2937] font-bold text-[16px] hover:bg-[#D1D5DB] transition-colors"
          >
            미션 목록으로 돌아가기
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