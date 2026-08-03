// src/app/group/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GroupFeedPage() {
  const params = useParams();
  const router = useRouter();
  
  // 모달(하이라이트 영상 재생) 상태 관리
  const [showHighlight, setShowHighlight] = useState(false);

  // 임시 데이터 (실제로는 백엔드에서 fetch)
  const groupData = {
    id: params.id,
    name: '여름 대비 꿀피부 만들기 ☀️',
    goalProgress: 65, // 21일 중 진행률 (%)
    dayCount: 14, // 14일차
  };

  const membersStatus = [
    { id: '1', name: '나 (지성)', mission: '야식 대신 물 마시기', status: 'completed', isShared: true },
    { id: '2', name: '지윤 (건성)', mission: '자기 전 수분크림', status: 'completed', isShared: false },
    { id: '3', name: '현아 (색소침착)', mission: '점심에 선크림 덧바르기', status: 'pending', isShared: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 relative">
      {/* 상단 헤더 */}
      <div className="bg-white px-5 py-4 sticky top-0 z-10 shadow-sm flex items-center">
        <button onClick={() => router.push('/group')} className="text-xl font-bold mr-4">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{groupData.name}</h1>
          <p className="text-xs text-gray-500">Day {groupData.dayCount} / 21</p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-8">
        
        {/* 10. 그룹 목표 진행률 */}
        <section className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">우리의 목표 달성률</h2>
            <span className="text-blue-600 font-bold">{groupData.goalProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000" 
              style={{ width: `${groupData.goalProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            21일 챌린지 완주까지 7일 남았어요! 화이팅 🔥
          </p>
        </section>

        {/* 11. 하이라이트 재생 썸네일 (어제 기준) */}
        <section 
          onClick={() => setShowHighlight(true)}
          className="relative w-full h-40 bg-gray-800 rounded-2xl overflow-hidden cursor-pointer shadow-md group"
        >
          {/* 실제로는 여기에 썸네일 이미지가 들어갑니다 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="text-white text-sm ml-1">▶</span>
            </div>
            <h3 className="text-white font-bold">Day 13: 우리의 하루</h3>
            <p className="text-gray-300 text-xs">어제 친구들의 미션 하이라이트</p>
          </div>
        </section>

        {/* 9. 멤버별 완료 여부 (오늘 기준) */}
        <section>
          <h2 className="font-bold text-gray-800 mb-4 px-1">오늘의 미션 현황</h2>
          <div className="space-y-3">
            {membersStatus.map((member) => (
              <div key={member.id} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">
                    {member.status === 'completed' ? '✅' : '⏳'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{member.name}</h3>
                    <p className="text-xs text-gray-500">{member.mission}</p>
                  </div>
                </div>
                
                {/* 비공개/공유 상태 처리 */}
                <div className="text-right">
                  {member.status === 'completed' ? (
                    member.isShared ? (
                      <button className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200">
                        영상 보기
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 px-2">비공개 완료</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 px-2">진행 전</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 내 미션 수행하러 가기 FAB (Floating Action Button) */}
      <div className="fixed bottom-6 left-0 right-0 px-5 z-10">
        <button 
          onClick={() => router.push('/mission')}
          className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <span>📸</span>
          <span>내 오늘의 미션 인증하기</span>
        </button>
      </div>

      {/* 11. 하이라이트 재생 풀스크린 모달 */}
      {showHighlight && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-5 flex justify-end">
            <button 
              onClick={() => setShowHighlight(false)}
              className="text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* 실제 비디오 태그가 들어갈 자리 */}
            <div className="w-full aspect-[9/16] bg-gray-900 flex items-center justify-center border border-gray-800">
              <p className="text-gray-500 text-sm animate-pulse">자동 완성된 30초 영상 재생 중...</p>
            </div>
            <div className="mt-8 text-center px-4">
              <h3 className="text-white font-bold text-xl mb-2">Day 13 완주 완료!</h3>
              <p className="text-gray-400 text-sm">어제도 모두가 각자의 미션을 해냈어요.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}