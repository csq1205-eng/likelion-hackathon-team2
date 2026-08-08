// src/app/group/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function GroupFeedPage() {
  const params = useParams();
  const router = useRouter();
  
  // 모달 상태 관리
  const [showHighlight, setShowHighlight] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState(''); //초대 링크

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      setInviteLink(`${currentOrigin}/group/invite/${params.id}`);
    }
  }, [params.id]);

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
    // 💡 최상위 부모 태그 시작
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 relative">
      
      {/* 상단 헤더 */}
      <div className="bg-white px-5 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => router.push('/group')} className="text-xl font-bold mr-4">←</button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{groupData.name}</h1>
            <p className="text-xs text-gray-500">Day {groupData.dayCount} / 21</p>
          </div>
        </div>

        {/* 💡 초대하기 버튼을 헤더 안쪽 우측으로 배치 */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold"
        >
          초대하기
        </button>
      </div>
      
      {/* 메인 피드 콘텐츠 영역 */}
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

        {/* 11. 하이라이트 재생 썸네일 */}
        <section 
          onClick={() => setShowHighlight(true)}
          className="relative w-full h-40 bg-gray-800 rounded-2xl overflow-hidden cursor-pointer shadow-md group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="text-white text-sm ml-1">▶</span>
            </div>
            <h3 className="text-white font-bold">Day 13: 우리의 하루</h3>
            <p className="text-gray-300 text-xs">어제 친구들의 미션 하이라이트</p>
          </div>
        </section>

        {/* 9. 멤버별 완료 여부 */}
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

      {/* 내 미션 수행하러 가기 FAB */}
      <div className="fixed bottom-6 left-0 right-0 px-5 z-10">
        <button 
          onClick={() => router.push('/mission')}
          className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <span>📸</span>
          <span>내 오늘의 미션 인증하기</span>
        </button>
      </div>

      {/* 5. QR코드 초대 팝업(모달) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm flex flex-col items-center shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-900 mb-2">친구 초대하기</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              친구가 카메라로 아래 QR코드를 스캔하면<br />이 그룹으로 바로 들어올 수 있어요!
            </p>
            
            <div className="bg-gray-50 p-4 rounded-2xl mb-6">
              <QRCodeCanvas 
                value={inviteLink} 
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={false}
              />
            </div>
            
            <div className="w-full flex space-x-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert('초대 링크가 복사되었습니다!');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
              >
                링크 복사
              </button>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
      
    {/* 💡 최상위 부모 태그 종료 */}
    </div>
  );
}