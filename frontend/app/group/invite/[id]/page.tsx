// src/app/group/invite/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function JoinCheck() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id; // URL에 있는 그룹 ID를 가져옵니다.

  const [isLogin, setIsLogin] = useState(true); // 테스트용 (실제로는 전역 상태나 토큰 확인)

  const handleJoin = () => {
    if (!isLogin) {
      alert("로그인이 필요합니다! 로그인 화면으로 이동합니다.");
      // router.push('/login');
      return;
    }
    // TODO: 백엔드 API에 참여 요청 보내기
    alert('그룹에 성공적으로 참여했습니다!');
    router.push(`/group/${groupId}`); // 참여 완료 후 해당 그룹 피드로 이동
  };

  return (
    <div className="bg-white flex-1 rounded-t-[32px] px-5 py-6 flex flex-col shadow-sm overflow-y-auto">
      <div className=''>
        <h1 className="text-[18px] text-[#000000] font-semibold mt-4 mb-4">
          함께할 그룹을 정해주세요     
        </h1>
      </div>
      <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-inner">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[30px] font-bold"
          >
            +
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-100 text-blue-600 px-[10px] py-[20px] y-1 rounded-lg text-[15px] font-bold"
          >
            <source />
            초대코드로 참여
          </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <h1 className="text-[18px] text-[#000000] font-semibold mt-4 mb-4">
          그룹 초대하기   
        </h1>
        <div className="flex -space-x-2 mb-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[14px] font-bold"
          >
            카카오톡
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[14px] font-bold"
          >
            URL
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[14px] font-bold"
          >
            QR
          </button>
        </div>
      </div>

      {/* 뒤로가기 버튼 */}
      <div className="space-y-2">
        <button
          onClick={handleJoin}
          className="font-semibold text-lg text-[#666666] transition-colors"
        >
         -
        </button>
      </div>
    </div>
  );     
}