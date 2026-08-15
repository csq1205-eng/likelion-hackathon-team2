// src/app/group/invite/[id]/create/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function GroupInviteCreate() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id;

  // API에서 받아올 링크와 QR 데이터를 저장할 상태
  const [inviteInfo, setInviteInfo] = useState({ link: '', qrImage: '' });
  const [isLoading, setIsLoading] = useState(true);

  // 카카오 SDK 초기화 (앱 실행 시 한 번만 필요)
  useEffect(() => {
    // 카카오 스크립트가 로드되어 있고, 아직 초기화되지 않았다면 초기화
    if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
      // TODO: 여기에 카카오 개발자 센터에서 발급받은 'JavaScript 키'를 넣으세요!
      window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY'); 
    }
  }, []);

  useEffect(() => {
    const generateInvite = async () => {
      try {
        const response = await fetch(`/api/v1/groups/${groupId}/invite`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json' 
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        setInviteInfo({ 
          link: result.data.inviteLink, 
          qrImage: result.data.qrImageUrl 
        });
      } else {
        alert(result.message || '초대 정보를 불러오지 못했습니다.');
      }

      } catch (error) {
        console.error('초대 정보 생성 실패:', error);

        
        console.log("통신 실패! 임시 테스트 데이터를 띄웁니다.");
        setInviteInfo({
          link: 'https://wedit.app/join/A1B2C3D4',
          qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wedit.app/join/A1B2C3D4' // 무료 QR 생성 API (임시)
        });
        
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      generateInvite();
    }
  }, [groupId]);

  // 클립보드 복사 기능
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteInfo.link);
    alert('초대 링크가 복사되었습니다!');
  };

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden">
      
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 py-6 flex flex-col">
      {/* 헤더 */}
        <button 
          onClick={() => router.back()} 
          className="text-[14px] font-bold text-[#555555] self-start mb-2"
        >
          ←
        </button>

        <h3 className="text-[15px] text-[#666666] font-semibold mt-2">
          그룹 초대
        </h3>
        <h1 className="text-[18px] text-[#000000] font-bold mt-2 mb-[2px]">
          우리 그룹으로 초대하기
        </h1>
        <h3 className="text-[11px] text-[#666666] font-semibold mb-[14px]">
          카메라로 QR을 찍으면 바로 참여돼요
        </h3>

        {isLoading ? (
          // 로딩 화면
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="w-10 h-10 border-4 border-[#A7FBE7] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#888888] font-semibold text-[14px]">초대장과 QR코드를 만들고 있어요...</p>
          </div>
        ) : (
          // 결과 화면
          <div className="flex flex-col flex-1 w-full items-center">
            
            {/* QR 코드 박스 */}
            <div className="w-[130px] h-[130px] bg-[#F7F7F7] rounded-[24px] flex items-center justify-center mb-[18px] shrink-0">
              <div className="bg-white p-[12px] rounded-[16px] shadow-sm w-[110px] h-[110px] flex items-center justify-center">
                <img 
                  src={inviteInfo.qrImage} 
                  alt="그룹 초대 QR 코드" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <span className="block w-full text-left text-[14px] text-[#000000] font-semibold mb-[8px]">
              또는 링크로 공유하기
            </span>
            {/* 링크 복사 영역 */}
            <div className="flex flex-row items-center w-full gap-[7px] mb-[12px] h-[50px]">
              {/* 링크 박스 */}
              <div className="flex-1 h-full bg-[#F7F7F7] px-[16px] rounded-[16px] flex items-center overflow-hidden">
                <span className="text-[14px] text-[#888888] font-medium truncate w-full">
                  {inviteInfo.link}
                </span>
              </div>
              <button 
                  onClick={handleCopy}
                  className="bg-[#E7F9F3] text-[#41C0A1] h-[50px] px-[12px] py-2 rounded-[16px] text-[13px] font-bold shrink-0 hover:bg-[#92edd8] transition-colors"
              >
                복사
              </button>
            </div>
          </div>

        )}

        <div className="mt-auto flex flex-col gap-2 shrink-0 pt-4 pb-2">
          <button
            onClick={shareToKakao}
            className="w-full py-[14px] rounded-[12px] font-semibold text-[16px] text-black bg-[#F7F5F5] hover:bg-[#FEE500] transition-colors flex flex-row items-center justify-center gap-2"
          >
            <svg className="w-6 h-6 text-[#41C0A1]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 3.134-9 7 0 2.22 1.258 4.195 3.197 5.432-.236.87-.852 2.766-.882 2.87-.038.136.06.262.186.216.12-.045 2.923-1.127 4.092-1.635.8.22 1.636.335 2.502.335 4.97 0 9-3.134 9-7s-4.03-7-9-7z"/>
            </svg>
            카카오톡으로 공유
          </button>

          <button
            onClick={() => router.push(`/group`)}
            className="mt-auto w-full py-[14px] rounded-[12px] font-semibold text-[16px] text-black bg-[#A7FBE7] hover:bg-[#92edd8] transition-colors shrink-0"
          >
            완료
          </button>
        </div>  

      </div>
    </div>
  );
}