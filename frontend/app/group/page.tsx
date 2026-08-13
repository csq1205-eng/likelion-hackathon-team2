'use client';

import { useRouter } from 'next/navigation';

const GROUP_THEMES = [
  { bg: 'bg-[#A7FBE7]', text: 'text-[#000000]' },
  { bg: 'bg-[#9884D2]', text: 'text-[#FFFFFF]' },
  { bg: 'bg-[#FFB74D]', text: 'text-[#FFFFFF]' },
  { bg: 'bg-[#64B5F6]', text: 'text-[#FFFFFF]' },
  { bg: 'bg-[#50C2A4]', text: 'text-[#FFFFFF]' }
];

export default function GroupListJoin() {
  const router = useRouter();
  
  // 임시 데이터 (나중에는 백엔드 API에서 가져올 데이터입니다)
  const myGroups = [
    { id: 'g1', name: '내 친구들', members: 3, progress: 2 },
    { id: 'g2', name: '대학 동기들', members: 5, progress: 4 },
  ];

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6">
      
      {/* 헤더 영역 */}
      <h3 className="text-[15px] text-[#666666] font-semibold mt-2">
        내 그룹
      </h3>
      
      <h1 className="text-[18px] text-[#000000] font-bold mt-2 mb-6">
        함께하는 그룹
      </h1>

      {/* 내 그룹 목록 */}
      <div className="space-y-3 flex-1 overflow-y-auto pb-[30px]">
        {myGroups.map((group, index) => {
          const theme = GROUP_THEMES[index % GROUP_THEMES.length];

          return (
            <div 
              key={group.id}
              onClick={() => router.push(`/group/${group.id}`)}
              className="bg-[#F9F9F9] p-4 rounded-[20px] flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[18px] shrink-0 ${theme.bg} ${theme.text}`}>
                {group.name.charAt(0)}
              </div>
              <div className="flex-1 ml-[12px] flex flex-col justify-center">
                <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {group.name}
                </h2>
                
                <p className="text-[11px] text-[#888888] font-semibold mt-[2px] mb-[2px]">
                  오늘 {group.progress}/{group.members}명 완료
                </p>
          
                <div className="w-[70%] bg-gray-200 rounded-full h-1.5 mt-[1px]">
                  <div 
                    className={`h-full ${theme.bg} rounded-full transition-all duration-500`} 
                    style={{ width: `${(group.progress / group.members) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-gray-400 shrink-0 ml-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          );
        })}
      
        {/* 하단 새 그룹 만들기 / 참여하기 버튼 */}
        <button 
          onClick={() => router.push('/group/invite/test-group-123')}
          className="w-full py-3 rounded-xl text-[#8B9A95] font-semibold text-[14px] border-dashed border-[1.2px] border-[#8B9A95] hover:bg-gray-50 transition-colors flex justify-center items-center"
        >
          + 새 그룹 만들기 / 참여하기
        </button>
        
      </div>
    </div>
  );
}