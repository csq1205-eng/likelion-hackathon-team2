'use client';

import { useRouter } from 'next/navigation';

const GROUP_THEMES = [
  { bg: 'bg-[#A7FBE7]', text: 'text-[#000000]' },
  { bg: 'bg-[#9884D2]', text: 'text-[#FFFFFF]' },
  { bg: 'bg-[#FFB74D]', text: 'text-[#FFFFFF]' },
  { bg: 'bg-[#64B5F6]', text: 'text-[#FFFFFF]' },
  { bg: 'bg-[#50C2A4]', text: 'text-[#FFFFFF]' },
];

export default function GroupListJoin() {
  const router = useRouter();

  const myGroups = [
    { id: 'g1', name: '내 친구들', members: 3, progress: 2 },
    { id: 'g2', name: '대학 동기들', members: 5, progress: 4 },
  ];

  return (
    <div className="flex flex-col w-full h-full relative bg-white px-5 py-6 pb-[100px]">

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
              {/* 그룹 아이콘 */}
              <div
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[18px] shrink-0 ${theme.bg} ${theme.text}`}
              >
                {group.name.charAt(0)}
              </div>

              {/* 그룹 정보 */}
              <div className="flex-1 ml-[12px] flex flex-col justify-center">
                <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {group.name}
                </h2>

                <p className="text-[11px] text-[#888888] font-semibold mt-[2px] mb-[2px]">
                  오늘 {group.progress}/{group.members}명 완료
                </p>

                {/* 진행률 */}
                <div className="w-[70%] bg-gray-200 rounded-full h-1.5 mt-[1px]">
                  <div
                    className={`h-full ${theme.bg} rounded-full transition-all duration-500`}
                    style={{
                      width: `${(group.progress / group.members) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* 화살표 */}
              <div className="text-gray-400 shrink-0 ml-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          );
        })}

        {/* 새 그룹 만들기 / 참여하기 */}
        <button
          onClick={() => router.push('/group/invite/test-group-123')}
          className="w-full py-3 rounded-xl text-[#8B9A95] font-semibold text-[14px] border-dashed border-[1.2px] border-[#8B9A95] hover:bg-gray-50 transition-colors flex justify-center items-center"
        >
          + 새 그룹 만들기 / 참여하기
        </button>
      </div>

      {/* 하단 탭 */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
        <TabIcon
          icon="users"
          label="그룹"
          isActive
          onClick={() => router.push('/group')}
        />

        <TabIcon
          icon="check"
          label="미션"
          onClick={() => router.push('/mission')}
        />

        <TabIcon
          icon="leaf"
          label="W 정원"
          onClick={() => router.push('/garden')}
        />

        <TabIcon
          icon="bar-chart"
          label="기록"
          onClick={() => router.push('/record/report')}
        />
      </div>
    </div>
  );
}

// 하단 탭 아이콘
function TabIcon({
  icon,
  label,
  isActive = false,
  onClick,
}: {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const colorClass = isActive
    ? 'text-[#41C0A1]'
    : 'text-[#BDBDBD]';

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}
    >
      {icon === 'users' && (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}

      {icon === 'check' && (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      )}

      {icon === 'leaf' && (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      )}

      {icon === 'bar-chart' && (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z" />
        </svg>
      )}

      <span className="text-[10px] font-bold">
        {label}
      </span>
    </div>
  );
}