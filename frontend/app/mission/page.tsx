'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'ready' | 'recording' | 'processing' | 'success' | 'fail';

export default function MissionCamera() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('ready');
  const [timeLeft, setTimeLeft] = useState(5);
  const [isShared, setIsShared] = useState(true); // 성공 시 공유 여부

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // 카메라 스트림 켜기
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, // 전면 카메라 우선
          audio: false // 기획상 음성 불필요 시 false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('카메라 권한을 얻지 못했습니다.', error);
        alert('미션 수행을 위해 카메라 권한이 필요합니다.');
      }
    }
    setupCamera();

    // 컴포넌트 언마운트 시 카메라 끄기
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 5초 촬영 타이머 및 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'recording') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStep('processing'); // 5초 뒤 자동 처리 단계로 넘어감
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // 처리 단계(AI 판정 모의) 시뮬레이션
  useEffect(() => {
    if (step === 'processing') {
      const mockAiProcessing = setTimeout(() => {
        // 임시로 70% 확률로 성공 판정
        const isSuccess = Math.random() > 0.3; 
        setStep(isSuccess ? 'success' : 'fail');
      }, 2000);
      return () => clearTimeout(mockAiProcessing);
    }
  }, [step]);

  const startRecording = () => {
    setStep('recording');
    setTimeLeft(5);
    // 실제 MediaRecorder 녹화 시작 로직이 들어갈 자리입니다.
  };

  const handleRetake = () => {
    setStep('ready');
  };

  const handleComplete = () => {
    // TODO: 백엔드로 클립 및 공유 여부(isShared) 전송
    console.log('공유 여부:', isShared);
    alert('인증이 완료되었습니다!');
    router.push('/group'); // 완료 후 그룹 피드로 복귀
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white relative">
      {/* 카메라 프리뷰 (항상 배경에 깔림) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      <div className="relative z-10 flex flex-col h-full p-6">
        {/* 상단 닫기 버튼 및 타이틀 */}
        <div className="flex justify-between items-center mb-auto">
          <button onClick={() => router.back()} className="text-xl font-bold text-white shadow-sm">✕</button>
          <span className="font-semibold bg-black/50 px-4 py-1 rounded-full text-sm">
            미션: 선크림 바르기
          </span>
          <div className="w-6"></div> {/* 균형을 위한 빈 공간 */}
        </div>

        {/* 하단 UI 제어부 (상태에 따라 변경) */}
        <div className="mt-auto flex flex-col items-center mb-8">
          
          {step === 'ready' && (
            <div className="text-center">
              <p className="mb-6 text-sm text-gray-200">얼굴이 나오지 않아도 괜찮아요!</p>
              <button 
                onClick={startRecording}
                className="w-20 h-20 bg-red-500 rounded-full border-4 border-white shadow-lg hover:scale-105 transition-transform"
              />
            </div>
          )}

          {step === 'recording' && (
            <div className="text-center">
              <div className="text-5xl font-bold mb-4 animate-pulse">{timeLeft}</div>
              <p className="text-sm">촬영 중...</p>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-lg">AI가 판정 중입니다...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="bg-white text-black p-6 rounded-3xl w-full text-center shadow-xl animate-fade-in-up">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">🎉 인증 성공!</h2>
              <p className="text-gray-600 text-sm mb-6">포인트가 적립되었습니다.</p>
              
              <label className="flex items-center justify-center space-x-2 mb-6 bg-gray-100 py-3 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isShared} 
                  onChange={() => setIsShared(!isShared)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span className="font-semibold text-gray-800">그룹 친구들에게 영상 공유하기</span>
              </label>

              <button 
                onClick={handleComplete}
                className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                완료하기
              </button>
            </div>
          )}

          {step === 'fail' && (
            <div className="bg-white text-black p-6 rounded-3xl w-full text-center shadow-xl animate-fade-in-up">
              <h2 className="text-2xl font-bold text-red-500 mb-2">🤔 아쉬워요</h2>
              <p className="text-gray-600 text-sm mb-6">선크림 바르는 모습이 명확하지 않아요.</p>
              <button 
                onClick={handleRetake}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                다시 촬영하기
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}