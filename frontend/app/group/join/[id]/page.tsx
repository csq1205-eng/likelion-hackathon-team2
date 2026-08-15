'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GroupJoinPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id;

  // 임시 그룹 데이터 (API에서 받아올 데이터 구조)
  const [groupData, setGroupData] = useState({
    name: '내 친구들',
    memberCount: 2,
    members: [
      { id: 1, name: '민지', initial: '민', bg: 'bg-[#EAF9F4]', text: 'text-[#50C2A4]' },
      { id: 2, name: '서연', initial: '서', bg: 'bg-[#F3EDFB]', text: 'text-[#9884D2]' },
    ]
  });

  const handleJoin = () => {
    // TODO: 백엔드 API 연동 (그룹 참여 요청)
    alert('그룹에 성공적으로 참여했습니다!');
    // 💡 시안의 의도대로, 참여가 완료되면 해당 그룹 피드로 바로 이동합니다.
    router.push(`/group/${groupId}`); 
  };

  const handleLoginAndJoin = () => {
    alert('로그인 페이지로 이동합니다.');
    // router.push('/login'); 
  };

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6">
      
      {/* 상단 타이틀 */}
      <h3 className="text-[15px] text-[#888888] font-bold mb-[12px]">
        그룹 참여
      </h3>

      {/* 중앙 컨텐츠 영역 */}
      <div className="flex flex-col items-center flex-1 w-full mt-[10px]">
        
        {/* 1. 그룹 대표 아이콘 */}
        <div className="w-[80px] h-[80px] rounded-full bg-[#EAF9F4] flex items-center justify-center mb-6">
          <span className="text-[36px] font-bold text-[#50C2A4]">
            우
          </span>
        </div>

        {/* 2. 그룹명 및 안내 문구 */}
        <h1 className="text-[24px] font-bold text-[#000000] mb-[3px]">
          {groupData.name}
        </h1>
        <p className="text-[15px] text-[#888888] font-medium mb-[18px]">
          그룹에 참여하시겠어요?
        </p>

        {/* 3. 현재 참여 중인 멤버 목록 */}
        <div className="flex flex-row items-center justify-center gap-[8px] mb-[10px]">
          {groupData.members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-[4px]">
              <div className={`w-[45px] h-[45px] rounded-full flex items-center justify-center ${member.bg}`}>
                <span className={`text-[17px] font-bold ${member.text}`}>
                  {member.initial}
                </span>
              </div>
              <span className="text-[13px] text-[#888888] font-medium">
                {member.name}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-[#A0A0A0] font-medium mb-[30px]">
          이미 {groupData.memberCount}명이 함께하고 있어요
        </p>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex flex-col w-full gap-[10px] mt-auto mb-[15px]">
        <button
          onClick={handleJoin}
          className="w-full py-[10px] rounded-full bg-[#A7FBE7] text-[#000000] font-semibold text-[16px] hover:bg-[#92edd8] transition-colors"
        >
          참여하기
        </button>
        <button
          onClick={handleLoginAndJoin}
          className="w-full py-[10px] rounded-full bg-[#F7F7F7] text-[#888888] font-semibold text-[16px] hover:bg-[#E8E8E8] transition-colors"
        >
          로그인 후 참여할게요
        </button>
      </div>

    </div>
  );
}