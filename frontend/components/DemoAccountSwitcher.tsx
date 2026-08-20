"use client";

import { useEffect, useState } from "react";

export function DemoAccountSwitcher() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNT_SWITCH === "true") {
      setIsVisible(true);
    }
  }, []);

  const switchAccount = (userId: number) => {
    const mockData = {
      accessToken: `temporary-token-${userId}`,
      userId: userId,
      onboardingCompleted: true,
      requiredConsentCompleted: true,
    };
    
    localStorage.setItem("wedit_auth", JSON.stringify(mockData));
    alert(`${userId}번 유저로 전환되었습니다!`);
    
    window.location.href = "/fe-e/group"; 
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-5 flex flex-col gap-2 z-[9999]">
      <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-t-md text-center">
        심사용 계정 전환
      </div>
      <button
        onClick={() => switchAccount(1)}
        className="bg-[#41C0A1] text-white text-xs font-bold py-2 px-3 rounded-md shadow-lg hover:bg-[#38a88d]"
      >
        계정 : A
      </button>
      <button
        onClick={() => switchAccount(2)}
        className="bg-[#B39DDB] text-white text-xs font-bold py-2 px-3 rounded-md shadow-lg hover:bg-[#9e86c8]"
      >
        계정 : B
      </button>
    </div>
  );
}