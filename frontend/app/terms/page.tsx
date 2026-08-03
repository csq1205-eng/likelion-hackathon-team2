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
  });

  const allRequiredChecked = agreements.terms && agreements.privacy && agreements.camera;
  const allChecked = allRequiredChecked && agreements.studydata && agreements.marketing;

  const handleAllCheck = () => {
    const newValue = !allChecked;
    setAgreements({
      terms: newValue,
      privacy: newValue,
      camera: newValue,
      studydata: newValue,
      marketing: newValue,
    });
  };

  const handleCheck = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  //API 호출 & 상세페이지 화면 열기
  const openDetailPage = async (id:string, title: string) => {
    try {
      const url = `/api/v1/users/{userId}/consent`;
      const response: await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();

      setDetailPage({
        isOpen: true,
        id: id,
        title: title,
        content: result.content,
      });
    } catch (error) {
      console.error('약관을 불러오는데 실패했습니다:', error);
      alert('약관 내용을 불러올 수 없습니다. 네트워크를 확인해 주세요.');
    }
  };

  // 상세 페이지에서 "동의하기" 버튼 클릭 시
  const handleAgreeOnDetail = () => {
    // 해당 항목을 true(체크 상태)로 변경하고
    setAgreements((prev) => ({
      ...prev,
      [detailPage.id]: true,
    }));
    // 상세 페이지 닫기 (원래 화면으로 복귀)
    setDetailPage({ isOpen: false, id: '', title: '', content: '' });
  };

  const onSubmit = () => {
    if (!allRequiredChecked) return;
    router.push('/onboarding'); 
  };

  //1. 약관 상세 페이지 (isOpen = true -> render)
  if (detailPage.isOpen) {
    return (
      <div className="flex flex-col h-screen bg-white animate-fade-in">
        {/* 상단 헤더 (뒤로가기) */}
        <div className="flex items-center px-5 py-4 border-b border-gray-100">
          <button 
            onClick={() => setDetailPage({ ...detailPage, isOpen: false })}
            className="text-2xl font-bold mr-4 text-gray-800"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">{detailPage.title}</h1>
        </div>
        
        {/* 약관 내용 영역 */}
        <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {detailPage.content}
        </div>

        {/* 하단 동의하기 버튼 */}
        <div className="p-5">
          <button 
            onClick={handleAgreeOnDetail}
            className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            동의하기
          </button>
        </div>
      </div>
    );
  }

  //2. 메인 약관 동의 화면 (isOpen = false -> render)
  return (
    <div className="flex flex-col h-screen bg-white px-5 py-8">
      <div className="flex-1">
        <h4 className="font-semibold text-[#666666] mt-27px ml-25px">
          개인정보 동의
        </h4>
        <h1 className="text-2xl font-bold text-gray-900 mt-15 mb-5">
          안전하게 시작할게요
        </h1>

        {/* 개별 동의 항목 */}
        <div className="space-y-4">
          <CheckboxItem 
            id="terms" label="이용약관 동의 (필수)" 
            checked={agreements.terms} onChange={() => handleCheck('terms')} 
          />
          <CheckboxItem 
            id="privacy" label="개인정보 수집 · 이용 동의 (필수)" 
            checked={agreements.privacy} onChange={() => handleCheck('privacy')} 
          />
          <CheckboxItem 
            id="camera" label="카메라 접근 권한 허용 (필수)" 
            checked={agreements.camera} onChange={() => handleCheck('camera')} 
          />
          <CheckboxItem 
            id="studydata" label="학습용 데이터 활용 동의 (선택)" 
            checked={agreements.studydata} onChange={() => handleCheck('studydata')} 
          />
          <CheckboxItem 
            id="marketing" label="[선택] 마케팅 정보 수신 동의" 
            checked={agreements.marketing} onChange={() => handleCheck('marketing')} 
          />
        </div>

        {/* 전체 동의 */}
        <label className="flex items-center space-x-3 mt-6 p-4 bg-gray-50 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={handleAllCheck}
            className="w-5 h-5 rounded border-gray-300 text-[#A7FBE7] focus:ring-blue-500"
          />
          <span className="font-semibold text-gray-800">네, 모두 동의합니다.</span>
        </label>

      </div>

      {/* 하단 고정 버튼 */}
      <button
        onClick={onSubmit}
        disabled={!allRequiredChecked}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
          allRequiredChecked 
            ? 'bg-[#A7FBE7] text-[#000000] hover:bg-[#A7FBE7]' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        동의하고 시작하기
      </button>
    </div>
  );
}

// 재사용 가능 체크박스 컴포넌트
function CheckboxItem({ id, label, checked, onChange, onOpenPage }: { id: string, label: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="flex items-center justify-between group">
      <label htmlFor={id} className="flex items-center justify-between cursor-pointer flex-1">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="w-5 h-5 rounded border-gray-300 text-[#A7FBE7] focus:ring-blue-500"
          />
          <span className="text-gray-700">{label}</span>
      </label>

      <button
        onClick={onOpenPage}
        className="text-sm text-gray-400 underline group-hover:text-gray-600">보기
      </button>
    </div>
  );
}