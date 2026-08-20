'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/api/client";

function MissionShareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clipId = searchParams.get('clipId') || '1';
  const groupId = searchParams.get('groupId') || '1';

  const { accessToken } = useAuth();

  // API 중복 호출 방지용 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 공개/비공개 상태 백엔드로 전송
  const updateClipVisibility = async (isShared: boolean) => {
    if (!accessToken) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await apiRequest(`/clips/${clipId}/share`, {
        method: 'PATCH',
        body: { shared: isShared },
        accessToken,
        customBaseUrl: "/api",
      });

      alert(isShared ? '그룹에 클립이 공유되었습니다!' : '비공개 처리되었습니다.');
      router.push(`/fe-e/group/${groupId}/status`);

    } catch (error) {
      console.error('API Error:', error);
      alert('서버와의 통신에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    updateClipVisibility(true); // 공유 상태 업데이트
  };

  const handlePrivate = () => {
    updateClipVisibility(false); // 비공개 상태 업데이트
  };

  return (
    <main className="w-full min-h-[100dvh] sm:h-[100dvh] bg-[#F7F8F8] sm:px-4 sm:py-6 flex items-center justify-center sm:overflow-hidden">
      <div className="mx-auto flex w-full min-h-[100dvh] sm:min-h-0 sm:h-[740px] max-w-none sm:max-w-sm flex-col sm:rounded-3xl bg-white px-5 py-6 sm:shadow-[0_8px_30px_rgba(31,42,37,0.06)] overflow-hidden relative">
         
        <div className="flex flex-col mt-10 w-full text-left flex-1 min-h-0">
          <h1 className="text-[23px] font-bold text-[#000000] leading-snug shrink-0">
            이 클립을 그룹에<br />
            공유할까요?
          </h1>
          <p className="text-[12px] text-[#666666] font-medium mt-[6px] shrink-0">
            공유하지 않아도 완료 여부는 그룹에 표시돼요
          </p>
        </div>

        <div className="flex flex-col w-full gap-[12px] mt-auto shrink-0 pb-2">
          <button
            onClick={handleShare}
            disabled={isSubmitting}
            className="w-full py-[16px] rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '공유 중...' : '공유하기'}
          </button>
          
          <button
            onClick={handlePrivate}
            disabled={isSubmitting}
            className="w-full py-[16px] rounded-[16px] bg-[#F7F8F8] text-[#000000] font-bold text-[16px] hover:bg-[#E8E8E8] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '비공개 중...' : '비공개로 두기'}
          </button>
        </div>

      </div>
    </main>
  );
}

export default function MissionSharePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <MissionShareInner />
    </Suspense>
  );
}