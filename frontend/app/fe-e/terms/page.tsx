'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PagePersonalInfoConsent() {
  const router = useRouter();

  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    camera: false,
    studydata: false,
    marketing: false,
  });

  const [detailPage, setDetailPage] = useState({
    isOpen: false,
    id: '',
    title: '',
    content: '',
    isLoading: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredChecked = agreements.terms && agreements.privacy && agreements.camera;

  const handleCheck = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openDetailPage = async (id: string, title: string) => {
    setDetailPage({ isOpen: true, id, title, content: '', isLoading: true });

    try {
      let mockContent = '';
      await new Promise(resolve => setTimeout(resolve, 300));

      switch (id) {
        case 'terms':
          mockContent = '제1조 (목적)\n본 약관은 WEDIT(이하 "회사")이 제공하는 AI 기반 웰니스 미션 서비스(이하 "서비스")의 이용 조건과 절차를 규정합니다.\n\n제2조 (서비스 내용)\n회사는 이용자의 생활 패턴을 분석하여 개인별 미션을 추천하고, 이용자가 촬영한 클립을 AI가 검증하여 미션 수행 여부를 판정합니다.\n\n제3조 (이용자의 의무)\n이용자는 실제 본인이 미션을 수행하는 모습을 촬영해야 하며, 조작된 자료를 제출하거나 미션 수행 시간을 허위로 기재하는 등 부정한 방법으로 인증해서는 안 됩니다. 타인의 사생활을 침해하는 촬영을 해서는 안 됩니다. 반복적인 부정 인증 시도가 확인될 경우 서비스 이용이 제한될 수 있습니다.\n\n제4조 (AI 판정에 대한 안내)\n미션 판정은 AI 모델에 의해 자동으로 이루어지며, 판정 결과에 이견이 있을 경우 재촬영을 통해 재판정을 요청할 수 있습니다. AI 판정은 참고용 검증 결과이며, 100% 정확도를 보장하지 않습니다.\n\n제5조 (서비스 이용 제한)\n1일 AI 판정 요청 횟수에는 제한이 있을 수 있으며, 이는 안정적인 서비스 운영을 위한 조치입니다.\n\n제6조 (책임의 한계)\n회사는 이용자가 제공한 정보의 정확성에 대해 책임지지 않으며, 미션 수행으로 인해 발생하는 개인의 신체적·정신적 영향에 대해 책임지지 않습니다.';
          break;
        case 'privacy':
          mockContent = '1. 수집하는 개인정보 항목\n- 필수: 이메일 또는 소셜 로그인 식별정보(카카오·구글), 피부\n타입, 생활 패턴 정보, 그룹 공동 목표\n미션 인증 시: 촬영된 클립(영상)\n선택: 학습용 데이터 활용 동의 시 판정 프레임의 임베딩 벡터\n2. 수집 목적\n회원 식별 및 로그인\n개인 맞춤 미션 생성 및 AI 판정\n그룹 기능(진행 현황, 하이라이트, 리포트) 제공\n(선택 동의 시) AI 모델 개선을 위한 학습 자료 활용\n\n3. 보유 및 이용 기간\n촬영된 클립(원본): 판정 및 당일 하이라이트 생성 완료 후 24시간 이내 파기 (단, 이용자가 직접 "공유"를 선택한 클립은 \n이용자가 삭제하기 전까지 보관)\n학습용 데이터 활용에 동의한 경우: 얼굴 등 식별정보를 제외한 벡터 형태로 별도 보관하며, 동의 철회 시 즉시 파기\n회원 탈퇴 시 모든 개인정보는 지체 없이 파기됩니다.\n\n4. 제3자 제공 및 처리위탁\n미션 판정 및 미션 생성을 위해 AI 모델 제공사(비전 분석 API)에 이미지 데이터가 전송될 수 있으며, 이는 판정 목적 외에는 \n사용되지 않습니다.\n\n5. 이용자의 권리\n이용자는 언제든지 본인의 개인정보 조회, 정정, 삭제를 요청할 수 있으며, 학습용 데이터 활용 동의는 설정 화면에서 언제든 철회할 수 있습니다.\n\n6. 카메라 권한\n미션 인증용 클립 촬영을 위해 카메라 접근 권한이 필요하며, 권한 미허용 시 클립 촬영 기능 이용이 제한됩니다.';
          break;
        case 'camera':
          mockContent = 'WEDIT은 5초 클립 챌린지 인증을 위해 카메라 접근 권한이 필수적으로 필요합니다.\n\n- 이용 목적: 미션 수행 영상 촬영\n- 카메라 권한을 허용하지 않을 경우 챌린지 참여가 불가능합니다.';
          break;
        case 'studydata':
          mockContent = '사용자가 촬영한 5초 클립 영상은 AI 미션 판정 모델을 고도화하기 위한 학습 데이터로 활용될 수 있습니다.\n\n- 보관 형태: 영상 내 얼굴 데이터는 제외되며, 판정을 위한 벡터(숫자) 형태로만 안전하게 보관됩니다.';
          break;
        case 'marketing':
          mockContent = 'WEDIT의 신규 챌린지 오픈, 리워드 이벤트, 제휴 커머스 할인 혜택 등의 마케팅 정보를 푸시 알림, 이메일 등으로 보내드립니다.\n\n동의하지 않으셔도 기본 서비스 이용은 가능합니다.';
          break;
        default:
          mockContent = '약관 내용을 준비 중입니다.';
      }

      setDetailPage({ 
        isOpen: true, 
        id: id, 
        title: title, 
        content: mockContent, 
        isLoading: false 
      });

    } catch (error) {
      console.error('약관 API 에러:', error);
      setDetailPage(prev => ({ 
        ...prev,
        content: '약관 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 
        isLoading: false 
      }));
    }
  };

  const handleAgreeOnDetail = () => {
    setAgreements((prev) => ({
      ...prev,
      [detailPage.id]: true,
    }));
    setDetailPage({ isOpen: false, id: '', title: '', content: '', isLoading: false });
  };

  const onSubmit = async () => {
    if (!allRequiredChecked) return;
    
    setIsSubmitting(true);

    try {
      const userId = 1; 

      const consentResponse = await fetch(`/api/v1/users/{userId}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privacyRequiredAgreed: true, // 필수 개인정보 처리 동의
        }),
      });

      const consentResult = await consentResponse.json();

      if (consentResult.success) {
        alert(consentResult.message || '약관 동의 처리 중 오류가 발생했습니다.');
        setIsSubmitting(false);
        return;
      }

      await fetch(`/api/v1/users/${userId}/consent/training-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreed: agreements.studydata,
        }),
      });

      // API 모두 정상 처리 : 온보딩 페이지로 이동
      router.push('/onboarding');
      
    } catch (error) {
      console.error('API Error:', error);
      alert('서버와의 통신에 실패했습니다. 네트워크 상태를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative">  
        {detailPage.isOpen && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white animate-fade-in">
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <button 
                onClick={() => setDetailPage({ ...detailPage, isOpen: false })}
                className="text-xl font-bold mr-3 text-gray-800"
              >
                ←
              </button>
              <h1 className="text-base font-bold text-gray-900">{detailPage.title}</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
              {detailPage.isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-gray-400 animate-pulse">약관을 불러오는 중입니다...</span>
                </div>
              ) : (
                detailPage.content
              )}
            </div>
            
            <div className="p-4">
              <button 
                onClick={handleAgreeOnDetail}
                className="w-full py-3 rounded-[12px] font-semibold text-sm bg-[#A7FBE7] hover:bg-[#92edd8]"
              >
                동의하기
              </button>
            </div>
          </div>
        )}

        {/* 메인 약관 동의 화면 */}
        <div className="bg-white flex-1 rounded-t-[32px] px-5 py-6 flex flex-col shadow-sm overflow-y-auto">
        <h3 className="text-[15px] text-[#666666] font-semibold">
          개인정보 동의
        </h3>
        
        <h1 className="text-[18px] text-[#000000] font-semibold mt-4 mb-4">
          안전하게 시작할게요
        </h1>

        <div className="space-y-3">
          <CheckboxCard 
            id="terms" 
            label="이용약관 동의 (필수)" 
            checked={agreements.terms} 
            onChange={() => handleCheck('terms')}
            onView={() => openDetailPage('terms', '이용약관 동의')} 
          />
          <CheckboxCard 
            id="privacy" 
            label="개인정보 수집 · 이용 동의 (필수)" 
            checked={agreements.privacy} 
            onChange={() => handleCheck('privacy')}
            onView={() => openDetailPage('privacy', '개인정보 수집 · 이용 동의')} 
          />
          <CheckboxCard 
            id="camera" 
            label="카메라 접근 허용 (필수)"
            subLabel="클립 촬영을 위해 필요해요" 
            checked={agreements.camera} 
            onChange={() => handleCheck('camera')}
            onView={() => openDetailPage('camera', '카메라 접근 권한 허용')} 
          />
          <CheckboxCard 
            id="studydata" 
            label="학습용 데이터 활용 (선택)"
            subLabel="얼굴 미포함 · 벡터 형태로만 보관"
            checked={agreements.studydata} 
            onChange={() => handleCheck('studydata')}
            onView={() => openDetailPage('studydata', '학습용 데이터 활용 동의')} 
          />
          <CheckboxCard 
            id="marketing" 
            label="마케팅 정보 수신 동의 (선택)" 
            checked={agreements.marketing} 
            onChange={() => handleCheck('marketing')}
            onView={() => openDetailPage('marketing', '마케팅 정보 수신 동의')} 
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={!allRequiredChecked || isSubmitting}
          className={`mt-auto w-full py-3 rounded-[12px] font-semibold text-[14px] transition-colors shrink-0 ${
            allRequiredChecked && !isSubmitting
              ? 'bg-[#A7FBE7] hover:bg-[#92edd8]' 
              : 'bg-[#F7F8F8] text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '처리 중...' : '동의하고 시작하기'}
        </button>
      </div>
    </div>
  );
}

function CheckboxCard({ 
  id, 
  label, 
  subLabel,
  checked, 
  onChange, 
  onView 
}: { 
  id: string; 
  label: string; 
  subLabel?: string; 
  checked: boolean; 
  onChange: () => void;
  onView: () => void; 
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#F7F8F8] rounded-[12px] hover:bg-[#f0f0f0] transition-colors">
      <label htmlFor={id} className="flex items-center flex-1 cursor-pointer overflow-hidden">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
        
        <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center mr-[12px] transition-colors shrink-0 ${
          checked ? 'bg-[#A7FBE7]' : 'bg-white shadow-sm'
        }`}>
          {checked && (
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </div>

        <div className="flex flex-col truncate pr-2">
          <span className="text-[11px] text-[#000000] font-semibold truncate">{label}</span>
          {subLabel && (
            <span className="text-[9px] text-[#666666] font-semibold mt-0.5 truncate">{subLabel}</span>
          )}
        </div>
      </label>

      <button
        onClick={onView}
        className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
        aria-label="약관 보기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>
  );
}