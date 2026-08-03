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
    <div className="flex flex-col h-screen bg-white px-5 py-8 items-center justify-center text-center">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* 그룹 대표 이미지나 아이콘 */}
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-inner">
          ✨
        </div>
        
        <h2 className="text-gray-500 text-sm font-semibold mb-2">WELLLOG 챌린지 초대장</h2>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          여름 대비 꿀피부 만들기
        </h1>
        
        <div className="flex -space-x-2 mb-4">
          {/* 멤버 프로필 미리보기 임시 UI */}
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">🙋‍♀️</div>
          <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">💁‍♀️</div>
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs text-blue-600 font-bold">+2</div>
        </div>
        <p className="text-gray-600 text-sm mb-10">현재 4명의 친구가 함께하고 있어요!</p>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full space-y-3">
        <button
          onClick={handleJoin}
          className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {isLogin ? '참여하기' : '로그인 후 참여하기'}
        </button>
        <button
          onClick={() => router.push('/group')}
          className="w-full py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}