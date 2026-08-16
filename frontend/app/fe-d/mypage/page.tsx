'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type TabType = 'calendar' | 'report' | 'reward';

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // 더미 데이터
  const userData = {
    name: '홍길동',
    points: 3200,
  };

  const weeklyReport = {
    successDays: 5,
    topMission: '선크림 바르기',
    comment: '이번 주는 자외선 차단에 완벽히 성공하셨네요! 피부 장벽이 튼튼해지고 있어요 ✨',
    stats: { moisture: 80, habit: 90, activity: 60 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* 상단 프로필 및 뒤로가기 */}
      <div className="bg-white px-5 py-6 rounded-b-3xl shadow-sm">
        <div className="flex items-center mb-6">
          <button onClick={() => router.push('/fe-e/group')} className="text-xl font-bold mr-4">←</button>
          <h1 className="text-2xl font-bold text-gray-900">{userData.name}님의 기록</h1>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-[12px]">
          <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="미션 달력" />
          <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')} label="주간 리포트" />
          <TabButton active={activeTab === 'reward'} onClick={() => setActiveTab('reward')} label="리워드" />
        </div>
      </div>

      <div className="p-5 flex-1">
        {/* 14. 지난 미션 달력 탭 */}
        {activeTab === 'calendar' && (
          <section className="bg-white p-5 rounded-2xl shadow-sm animate-fade-in-up">
            <h2 className="font-bold text-lg mb-4 text-gray-800">8월 미션 기록</h2>
            {/* 임시 달력 UI (7x4 그리드) */}
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-gray-400 font-semibold mb-2">{day}</div>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                // 임의로 며칠에만 성공(✅) 표시
                const isSuccess = [3, 4, 5, 8, 9, 10, 11, 14, 15].includes(i);
                return (
                  <div key={i} className={`aspect-square flex items-center justify-center rounded-lg ${isSuccess ? 'bg-blue-100' : 'bg-gray-50'}`}>
                    {isSuccess ? <span className="text-lg">✅</span> : <span className="text-gray-400">{i + 1}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 12. 주간 리포트 탭 */}
        {activeTab === 'report' && (
          <section className="space-y-4 animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl text-white shadow-md">
              <h2 className="font-bold text-lg mb-1">이번 주 {weeklyReport.successDays}일 성공!</h2>
              <p className="text-sm opacity-90 leading-relaxed mt-2">{weeklyReport.comment}</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800">성취도 분석</h3>
              <ProgressBar label="수분 충전" percent={weeklyReport.stats.moisture} color="bg-blue-400" />
              <ProgressBar label="규칙적 습관" percent={weeklyReport.stats.habit} color="bg-green-400" />
              <ProgressBar label="활동량" percent={weeklyReport.stats.activity} color="bg-orange-400" />
            </div>
          </section>
        )}

        {/* 13. 포인트 화면 탭 */}
        {activeTab === 'reward' && (
          <section className="space-y-4 animate-fade-in-up">
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center border-2 border-blue-100">
              <p className="text-gray-500 text-sm font-semibold mb-1">사용 가능한 포인트</p>
              <h2 className="text-4xl font-bold text-blue-600 flex items-center justify-center gap-2">
                <span className="text-2xl text-yellow-500">🪙</span>
                {userData.points.toLocaleString()} P
              </h2>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">포인트로 제휴 상품 응모하기</h3>
              <div className="space-y-3">
                <RewardItem name="AAC 시카 수분 크림 럭키드로우" point={1000} />
                <RewardItem name="올리브영 1만원권 럭키드로우" point={1500} />
                <RewardItem name="스타벅스 아메리카노 교환권" point={3000} />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ----------------- 서브 컴포넌트들 ----------------- //

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
        active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function ProgressBar({ label, percent, color }: { label: string, percent: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function RewardItem({ name, point }: { name: string, point: number }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-[12px] hover:bg-gray-50">
      <div>
        <h4 className="font-semibold text-sm text-gray-800">{name}</h4>
        <p className="text-xs text-blue-600 font-bold">{point.toLocaleString()} P</p>
      </div>
      <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
        응모
      </button>
    </div>
  );
}