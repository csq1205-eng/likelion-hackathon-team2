// src/app/group/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function GroupListJoin() {
  const router = useRouter();
  
  // 임시 데이터 (나중에는 백엔드 API에서 가져올 데이터입니다)
  const myGroups = [
    { id: 'g1', name: '여름 대비 꿀피부 만들기 ☀️', members: 3, progress: 45 },
    { id: 'g2', name: '아침형 인간 프로젝트', members: 5, progress: 12 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-5 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 챌린지 그룹</h1>
        {/* 임시로 초대 화면 확인을 위해 만들어둔 버튼입니다 */}
        <button 
          onClick={() => router.push('/group/invite/test-group-123')}
          className="text-sm text-blue-600 underline"
        >
          초대 링크 테스트
        </button>
      </div>

      {/* 내 그룹 목록 */}
      <div className="space-y-4 mb-8">
        {myGroups.map((group) => (
          <div 
            key={group.id} 
            onClick={() => router.push(`/group/${group.id}`)}
            className="bg-white p-5 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-800">{group.name}</h2>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
                멤버 {group.members}명
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${group.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">그룹 진행률 {group.progress}%</p>
          </div>
        ))}
      </div>

      {/* 새 그룹 만들기 버튼 */}
      <button 
        className="mt-auto w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
      >
        + 새로운 챌린지 그룹 만들기
      </button>
    </div>
  );
}