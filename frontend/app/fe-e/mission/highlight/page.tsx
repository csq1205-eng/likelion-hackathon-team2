'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from "@/lib/auth/AuthProvider";

interface HighlightMemberItem {
  id: number;
  name: string;
  type: 'clip' | 'card';
  content: string;
  mediaUrl?: string;
  time: string;
}

interface HighlightPageResponse {
  groupId: number;
  dateStr: string;
  title: string;
  videoUrl: string; 
  members: HighlightMemberItem[];
}

const FALLBACK_HIGHLIGHT: HighlightPageResponse = {
  groupId: 10,
  dateStr: "8월 12일 수요일",
  title: "우리의 하루",
  // 테스트용 샘플 비디오 링크
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  members: [
    { id: 1, name: "효림", type: "clip", content: "아침 선크림 완료!", mediaUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop", time: "오전 7:20" },
    { id: 2, name: "민서", type: "card", content: "물 2L 마시기", time: "오전 7:34 완료" },
    { id: 3, name: "지우", type: "clip", content: "20분 걷기 성공!", mediaUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=300&auto=format&fit=crop", time: "오전 8:05" },
  ]
};

export default function HighlightPage() {
  const router = useRouter();

  const params = useParams();
  const groupId = params.groupId || '1';

  const { accessToken, isLoading: authLoading } = useAuth();

  const [highlightData, setHighlightData] = useState<HighlightPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 비디오 플레이어 제어를 위한 상태 및 Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setHighlightData(FALLBACK_HIGHLIGHT);
      setIsLoading(false);
      return;
    }

    const fetchHighlight = async () => {
      try {
        const response = await fetch(`/api/v1/groups/${groupId}/highlight`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setHighlightData({
            ...result.data,
            videoUrl: result.data.videoUrl || FALLBACK_HIGHLIGHT.videoUrl
          });
        } else {
          throw new Error('하이라이트 정보를 불러오지 못했습니다.');
        }
      } catch (error) {
        console.error("하이라이트 조회 실패! 임시 데이터를 렌더링합니다:", error);
        setHighlightData(FALLBACK_HIGHLIGHT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlight();
  }, [authLoading, accessToken]);

  // 비디오 플레이어 조작 핸들러
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = Number(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + amount, 0), duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading || !highlightData) {
    return (
      <div className="flex flex-col w-full h-[100dvh] items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#41C0A1] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-[#999]">하이라이트를 불러오는 중...</p>
      </div>
    );
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      {/* 비디오 태그 소스 */}
      <video
        ref={videoRef}
        src={highlightData.videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        playsInline
        className="hidden" // 화면 구성상 아래 썸네일/카드와 연동되므로 오디오/비디오 엔진으로만 활용
      />

      {/* 본문 스크롤 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[100px] flex flex-col relative bg-gradient-to-b from-[#EAF7F7] from-[15%] to-white">

        {/* 배경 별 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[-10%] w-[60%] h-[400px] bg-gradient-to-br from-[#E2F7F2] to-transparent rounded-full blur-[80px] -z-10 opacity-70 pointer-events-none"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[300px] bg-gradient-to-bl from-[#F3EDFF] to-transparent rounded-full blur-[80px] -z-10 opacity-70 pointer-events-none"></div>
        <div className="absolute top-[100px] left-[12%] text-[#83E2C4] opacity-50 text-[16px] pointer-events-none z-0">✦</div>
        <div className="absolute top-[85px] left-[35%] text-[#A7FBE7] opacity-80 text-[24px] pointer-events-none z-0 drop-shadow-sm">✦</div>
        <div className="absolute top-[95px] right-[10%] text-[#B39DDB] opacity-70 text-[22px] pointer-events-none z-0 drop-shadow-sm">✦</div>
        <div className="absolute top-[425px] right-[78%] text-[#83E2C4] opacity-60 text-[18px] pointer-events-none z-0">✦</div>
        <div className="absolute top-[490px] left-[33%] text-[#EADDFF] opacity-60 text-[20px] pointer-events-none z-0">✦</div>
        <div className="absolute top-[480px] right-[10%] text-[#A7FBE7] opacity-50 text-[14px] pointer-events-none z-0">✦</div>
      </div>

        {/* 상단 배경 꾸밈 요소 */}
        <div className="sticky top-0 z-50 flex flex-col items-center justify-center pt-6 pb-4 shrink-0 bg-white border-b border-[#EAF7F7]/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <button onClick={() => router.back()} 
            className="absolute left-5 top-7 text-[22px] font-bold text-[#A0A0A0] hover:opacity-70 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-[17px] font-extrabold text-[#000000]">{highlightData.title}</h1>
          <p className="text-[12px] text-[#666666] font-medium mt-0.5">{highlightData.dateStr}</p>
        </div>

        {/* 중앙 3단 세로 카드 영역 */}
        <div className="flex flex-row justify-center gap-2.5 w-full px-5 mt-[30px] z-10">
          {highlightData.members.map((member) => (
            <div key={member.id} className="flex flex-col items-center w-1/3">
              
              {member.type === 'clip' ? (
                <div className="relative w-full aspect-[4/9] rounded-[16px] overflow-hidden shadow-sl bg-white transform transition-transform hover:-translate-y-1">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${member.mediaUrl}')` }}></div>
                  
                  {/* 상단 밀착 라벨 */}
                  <div className="absolute top-0 left-0 w-full z-10">
                    <div className="bg-[#41C0A1] text-white text-[10px] font-semibold py-[4px] text-center rounded-b-[0px] rounded-t-none shadow-sm">
                      {member.name} · 클립
                    </div>
                  </div>

                  <div className="absolute bottom-0 w-full pt-8 pb-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-[10px] font-semibold text-center italic">{member.content}</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[4/9] rounded-[16px] overflow-hidden shadow-sm flex flex-col items-center transform transition-transform hover:-translate-y-1">
                  <div className="absolute inset-0 z-0">
                    <Image 
                      src="/highlight_longCard.png"
                      alt="비공유 롱카드 배경"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="absolute top-0 left-0 w-full z-10">
                    <div className="bg-[#B39DDB] text-white text-[10px] font-semibold py-[4px] text-center rounded-b-[0px] rounded-t-none shadow-sm">
                      비공유 · 완료
                    </div>
                  </div>

                  <div className="mt-auto mb-[2px] flex flex-col items-center w-full px-[4px] z-10">
                    <span className="text-[13px] font-extrabold text-[#222222]">{member.name}</span>
                    
                    <div className="bg-white/80 rounded-[8px] px-[2px] py-1.5 flex items-center justify-center mt-[3px] w-full shadow-sm">
                      <span className="text-[10px] text-[#5B3BC4] font-bold truncate tracking-tight">{member.content}</span>
                    </div>
                    <span className="text-[9px] text-[#888888] font-medium mt-[5px] mb-[11px]">{member.time}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 썸네일 & 타임라인 플레이어 카드 */}
        <div className="px-[16px] mt-[20px]">
          <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full border border-gray-50 flex flex-col">
            <div className="flex gap-2 justify-between">
              {highlightData.members.map((m, idx) => (
                <div key={m.id} className="relative w-1/3 aspect-[4/3] rounded-[12px] overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                  {m.mediaUrl ? (
                    <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('${m.mediaUrl}')` }}></div>
                  ) : (
                    <div className="absolute inset-0 z-0">
                    <Image 
                      src="/highlight_shortCard.png"
                      alt="비공유 숏카드 배경"
                      fill
                      className="object-cover"
                    />
                    </div>
                  )}
                  <div className="absolute top-1 w-full flex justify-center">
                    <span className={`${m.type === 'clip' ? 'bg-[#41C0A1]' : 'bg-[#B39DDB]'} text-white text-[7px] font-bold px-1.5 py-[2px] rounded-full`}>
                      {m.type === 'clip' ? '클립' : '완료 카드'}
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 w-[18px] h-[18px] bg-black/60 rounded-full text-white text-[8px] flex items-center justify-center font-bold">
                    0{idx + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* 실제 조작 가능한 프로그레스 바 (Range Input) */}
            <div className="relative w-full h-[6px] bg-[#EAEAEA] rounded-full mt-4 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
              />
              <div className="absolute top-0 left-0 h-full bg-[#41C0A1] rounded-full pointer-events-none" style={{ width: `${progressPercent}%` }}></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-[14px] h-[14px] bg-white border-[3.5px] border-[#B39DDB] rounded-full shadow-sm pointer-events-none z-10"
                style={{ left: `calc(${progressPercent}% - 7px)` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 재생 컨트롤 영역 (실제 함수 연결) */}
        <div className="flex flex-col items-center mt-5">
          <span className="text-[12px] font-bold text-[#555555]">
            {formatTime(currentTime)} / {formatTime(duration || 30)}
          </span>
          
          <div className="flex items-center gap-10 mt-3">
            {/* -10초 버튼 */}
            <button 
              onClick={() => skipTime(-10)}
              className="text-black hover:opacity-70 transition-opacity flex items-center justify-center relative"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 2v6h6M2.66 15.5c1.1 3.2 4.1 5.5 7.6 5.5 4.5 0 8.2-3.7 8.2-8.2s-3.7-8.2-8.2-8.2c-2.3 0-4.4.9-5.9 2.4L2.5 8" />
              </svg>
              <span className="absolute text-[8px] font-bold top-[12px]">10</span>
            </button>
            
            {/* 재생/일시정지 버튼 */}
            <button 
              onClick={togglePlay}
              className="w-[42px] h-[42px] bg-black text-white rounded-full flex items-center justify-center pl-1 hover:bg-gray-800 transition-colors shadow-md"
            >
              {isPlaying ? (
                /* 일시정지 아이콘 */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                /* 재생 아이콘 */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4l15 8-15 8z" />
                </svg>
              )}
            </button>

            {/* +10초 버튼 */}
            <button 
              onClick={() => skipTime(10)}
              className="text-black hover:opacity-70 transition-opacity flex items-center justify-center relative"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.5c-1.1 3.2-4.1 5.5-7.6 5.5-4.5 0-8.2-3.7-8.2-8.2s3.7-8.2 8.2-8.2c2.3 0 4.4.9 5.9 2.4l1.9 1.9" />
              </svg>
              <span className="absolute text-[8px] font-bold top-[12px]">10</span>
            </button>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="flex flex-col items-center px-6 mt-6 gap-2">
          <p className="text-[11px] text-[#555555] font-medium text-center leading-relaxed">
            공유 멤버는 실제 클립으로, 비공유 멤버는 완료 카드로<br />AI가 자막을 더해 30초 하이라이트를 만들어요!
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#888888] font-medium mt-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            직접 공유한 클립만 친구에게 보여요
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex flex-row w-full px-5 gap-[8px] mt-6">
          <button 
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="flex-1 py-[12px] rounded-[14px] border-[1.5px] border-[#E0E0E0] text-[#333333] font-bold text-[15px] bg-white hover:bg-gray-50 transition-colors"
          >
            다시 보기
          </button>
          <button 
            onClick={() => alert("하이라이트 링크가 복사되었습니다!")}
            className="flex-1 py-[12px] rounded-[14px] text-white font-bold text-[15px] bg-[#41C0A1] hover:bg-[#38a88d] transition-colors shadow-sm"
          >
            공유하기
          </button>
        </div>
      </div>

      {/* 하단 탭 바 (4개 탭 구조 통일) */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-5 pt-4 pb-5 z-50">
        <TabIcon icon="users" label="그룹" onClick={() => router.push('/fe-e/group')} />
        <TabIcon icon="check" label="미션" onClick={() => router.push('/fe-d/mission')} />
        <TabIcon icon="leaf" label="W 정원" onClick={() => router.push(`/fe-d/${groupId}/garden`)} />
        <TabIcon icon="bar-chart" label="기록" isActive onClick={() => router.push('/fe-e/record/report')} />
      </div>
    </div>
  );
}

function NumberStar({ num, color }: { num: number, color: string }) {
  return (
    <div className="relative w-[34px] h-[34px] flex items-center justify-center z-20">
      <svg className="absolute inset-0 w-full h-full drop-shadow-sm" viewBox="0 0 24 24" fill={color}>
        <path d="M12 2l2.6 5.8 6.4.5-4.8 4.3 1.5 6.2-5.7-3.2-5.7 3.2 1.5-6.2-4.8-4.3 6.4-.5L12 2z" />
      </svg>
      <span className="relative text-white text-[13px] font-extrabold pb-[1px] pr-[1px]">{num}</span>
    </div>
  );
}

function TabIcon({ icon, label, isActive = false, onClick }: { icon: string, label: string, isActive?: boolean, onClick?: () => void }) {
  const colorClass = isActive ? "text-[#41C0A1]" : "text-[#BDBDBD]";
  return (
    <div onClick={onClick} className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-12 ${colorClass}`}>
      {icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
      {icon === 'check' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
      {icon === 'leaf' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
      {icon === 'bar-chart' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h3v10H4zM10 4h3v16h-3zM16 14h3v6h-3z"/></svg>}
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}