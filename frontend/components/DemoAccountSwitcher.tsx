"use client";

export function DemoAccountSwitcher() {
  const switchAccount = (userId: number) => {
    // 기존 인증 정보 날리고 선택한 유저로 강제 세팅
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

  return (
    <div className="fixed bottom-24 right-5 flex flex-col gap-2 z-[9999]">
      <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-t-md text-center shadow-lg">
        심사용 계정 전환
      </div>
      <button
        onClick={() => switchAccount(1)}
        className="bg-[#41C0A1] text-white text-xs font-bold py-2 px-3 rounded-md shadow-lg hover:bg-[#38a88d] transition-colors"
      >
        계정 : A
      </button>
      <button
        onClick={() => switchAccount(2)}
        className="bg-[#B39DDB] text-white text-xs font-bold py-2 px-3 rounded-md shadow-lg hover:bg-[#9e86c8] transition-colors"
      >
        계정 : B (그룹 참여용)
      </button>
    </div>
  );
}