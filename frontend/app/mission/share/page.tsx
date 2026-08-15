'use client';

import { useRouter } from 'next/navigation';

export default function MissionSharePage() {
  const router = useRouter();

  const handleShare = () => {
    // TODO: 백엔드에 클립 '공유' 상태로 전송하는 API 연결
    alert('그룹에 클립이 공유되었습니다!');
    router.push(`/group/{groupId}/status`);
  };

  const handlePrivate = () => {
    // TODO: 백엔드에 클립 '비공개' 상태로 전송하는 API 연결
    alert('비공개로 완료 처리되었습니다.');
    router.push(`/group/{groupId}/status`);
  };

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6">
        <div className="flex flex-col mt-10 w-full text-left">
          <h1 className="text-[23px] font-bold text-[#000000] leading-snug">
            이 클립을 그룹에<br />
            공유할까요?
          </h1>
          <p className="text-[12px] text-[#888888] font-medium mt-[6px]">
            공유하지 않아도 완료 여부는 그룹에 표시돼요
          </p>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex flex-col w-full gap-[12px] mt-auto">
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-[16px] bg-[#A7FBE7] text-[#000000] font-bold text-[16px] hover:bg-[#92edd8] transition-colors"
          >
            공유하기
          </button>
          
          <button
            onClick={handlePrivate}
            className="w-full py-4 rounded-[16px] bg-[#F7F7F7] text-[#000000] font-bold text-[16px] hover:bg-[#E8E8E8] transition-colors"
          >
            비공개로 두기
          </button>
        </div>

      </div>
  );
}