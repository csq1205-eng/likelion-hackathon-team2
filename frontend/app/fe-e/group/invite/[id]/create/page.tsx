// src/app/fe-e/group/invite/[id]/create/page.tsx

'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/api/client";

interface InviteResponseDTO {
  inviteLink: string;
  qrImageUrl: string;
}


declare global {
  interface Window {
    Kakao: any;
  }
}


export default function GroupInviteCreate() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { accessToken } = useAuth();

  const [inviteInfo, setInviteInfo] = useState({ link: '', qrImage: '' });
  const [isLoading, setIsLoading] = useState(true);

  // 카카오 SDK 스크립트 동적 로드 및 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
   
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
    script.integrity = 'sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        // 본인의 카카오 개발자 센터 JavaScript 키 변경 부분 (완료)
        window.Kakao.init('778324986d8643a9a889516bddc37d02');
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

 useEffect(() => {
    const generateInvite = async () => {
      if (!accessToken) return;
      try {
        const data = await apiRequest<InviteResponseDTO>(`/groups/${groupId}/invite`, {
          method: 'GET',
          accessToken,
        });

        const savedCode = localStorage.getItem('lastInviteCode') || '839201';
        
        const link = data?.inviteLink || `https://wedit.app/join/${savedCode}`;
        const qrImage = data?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${link}`;

        setInviteInfo({
          link: link,
          qrImage: qrImage
        });

      } catch (error) {
        console.error('초대 정보 생성 실패:', error);

        const savedCode = localStorage.getItem('lastInviteCode') || '839201';
        
        setInviteInfo({
          link: `https://wedit.app/join/${savedCode}`,
          qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wedit.app/join/${savedCode}`
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      generateInvite();
    }
  }, [groupId, accessToken]);

  // 클립보드 복사 기능
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteInfo.link);
    alert('초대 링크가 복사되었습니다!');
  };

  const shareToKakao = () => {
    if (typeof window === 'undefined' || !window.Kakao) {
      alert('카카오 SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!window.Kakao.isInitialized()) {
      alert('카카오 SDK가 초기화되지 않았습니다.');
      return;
    }

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '우리 그룹으로 초대합니다!',
        description: '#위디트 #루틴 #습관기록 #그룹초대',
        imageUrl: inviteInfo.qrImage || 'http://k.kakaocdn.net/dn/bLPLfX/dJMcacayNt1/iWQpxLOqbqcyg2hxzKCEE1/kakaolink40_original.png',
        link: {
          mobileWebUrl: inviteInfo.link,
          webUrl: inviteInfo.link,
        },
      },
      buttons: [
        {
          title: '그룹 참여하기',
          link: {
            mobileWebUrl: inviteInfo.link,
            webUrl: inviteInfo.link,
          },
        },
      ],
    });
  };

  return (
    <main className="w-full min-h-[100dvh] sm:h-[100dvh] bg-[#F7F8F8] sm:px-4 sm:py-6 flex items-center justify-center sm:overflow-hidden">
      <div className="mx-auto flex w-full min-h-[100dvh] sm:min-h-0 sm:h-[740px] max-w-none sm:max-w-sm flex-col sm:rounded-3xl bg-white px-6 py-6 sm:shadow-[0_8px_30px_rgba(31,42,37,0.06)] overflow-hidden">
        
        <div className="w-full h-full flex flex-col justify-between">
        
          {/* 상단 타이틀 영역 */}
          <div className="flex flex-col shrink-0">
            <button
              onClick={() => router.back()}
              className="mb-2 text-[#A0A0A0] w-fit hover:opacity-70 transition-opacity"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <span className="text-[15px] text-[#666666] font-semibold">
              그룹 초대
            </span>
            <h1 className="text-[18px] text-[#000000] font-bold mt-0.5">
              우리 그룹으로 초대하기
            </h1>
            <p className="text-[11px] text-[#666666] font-medium mb-[10px]">
              카메라로 QR을 찍으면 바로 참여돼요
            </p>
          </div>

          {isLoading ? (
            // 로딩 화면
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="w-8 h-8 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-[15px]"></div>
              <p className="text-[#666666] font-semibold text-[13px]">초대장과 QR코드를 만들고 있어요...</p>
            </div>
          ) : (
            // 결과 화면
            <div className="flex flex-col items-center justify-center my-auto w-full">
            
              {/* QR 코드 박스 */}
              <div className="w-[140px] h-[140px] bg-[#F7F7F7] rounded-t-[20px] flex items-center justify-center shrink-0 shadow-2xs">
                <div className="bg-white p-2 rounded-[14px] shadow-sm w-[124px] h-[124px] flex items-center justify-center">
                  <Image
                    src={inviteInfo.qrImage || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wedit.app"}
                    alt="그룹 초대 QR 코드"
                    width={124}
                    height={124}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
              </div>

              {(() => {
              const link = inviteInfo?.link ?? '';
              const codeMatch = link.match(/\/join\/([^/]+)$/);
              const inviteCode = codeMatch
                ? codeMatch[1]
                : '839201';

              const handleCodeCopy = () => {
                navigator.clipboard.writeText(inviteCode);
                alert(`초대 코드 [${inviteCode}]가 복사되었습니다!`);
              };

              return (
                <div
                  onClick={handleCodeCopy}
                  className="w-[140px] bg-[#F7F7F7] hover:bg-[#EFEFEF] active:scale-[0.98] transition-all cursor-pointer rounded-b-[14px] pt-[3px] pb-[10px] px-[12px] flex items-center justify-between mb-[20px] select-all"
                  title="클릭하여 복사"
                >
                  <div className="flex flex-col items-center justify-center w-full">
                    <span className="text-[16px] text-[#000000] text-center font-bold tracking-wider">{inviteCode}</span>
                  </div>
                </div>
              );
            })()}

              <span className="block w-full text-left text-[13px] text-[#000000] font-semibold mt-[5px] mb-[8px]">
                또는 링크로 공유하기
              </span>
            
              {/* 링크 복사 영역 */}
              <div className="flex flex-row items-center w-full gap-2 h-[46px] mb-[10px]">
                <div className="flex-1 h-full bg-[#F7F7F7] px-[16px] rounded-[14px] flex items-center overflow-hidden">
                  <span className="text-[13px] text-[#666666] font-medium truncate w-full">
                    {inviteInfo.link}
                  </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="bg-[#E7F9F3] text-[#41C0A1] h-[46px] px-3.5 rounded-[14px] text-[13px] font-bold shrink-0 hover:bg-[#92edd8] transition-colors"
                >
                  복사
                </button>
              </div>
            </div>
          )}

          {/* 하단 버튼 영역 */}
          <div className="flex flex-col gap-2 shrink-0 pt-[5px]">
            <button
              onClick={shareToKakao}
              className="w-full py-[13px] rounded-[14px] font-semibold text-[14px] text-black bg-[#F7F8F8] hover:bg-[#FEE500] transition-colors flex flex-row items-center justify-center gap-[8px] shadow-2xs"
            >
              <svg className="w-5 h-5 text-[#41C0A1]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 3.134-9 7 0 2.22 1.258 4.195 3.197 5.432-.236.87-.852 2.766-.882 2.87-.038.136.06.262.186.216.12-.045 2.923-1.127 4.092-1.635.8.22 1.636.335 2.502.335 4.97 0 9-3.134 9-7s-4.03-7-9-7z"/>
              </svg>
              카카오톡으로 공유
            </button>

            <button
              onClick={() => router.push(`/fe-e/group`)}
              className="mt-[4px] w-full py-[14px] rounded-[14px] font-semibold text-[14px] text-black bg-[#A7FBE7] hover:bg-[#92edd8] transition-colors"
            >
              완료
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}