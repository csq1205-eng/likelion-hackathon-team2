"use client";

export function DemoAccountSwitcher() {
  const switchAccount = (userId: number) => {
    const mockData = {
      accessToken: `temporary-token-${userId}`,
      userId: userId,
      onboardingCompleted: true,
      requiredConsentCompleted: true,
    };
    
    localStorage.setItem("wedit_auth", JSON.stringify(mockData));
    if (userId === 2) {
      localStorage.removeItem("myGroupId");
      alert("B계정(참여자)으로 전환되었습니다. 초대 코드 입력 페이지로 이동합니다!");
      window.location.href = "/fe-e/group/invite/1"; // 초대 확인 및 코드 입력 페이지로 이동
    } else {
      alert("A계정(방장)으로 전환되었습니다!");
      window.location.href = "/fe-e/group"; 
    }
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
        계정 : A (방장)
      </button>
      <button
        onClick={() => switchAccount(2)}
        className="bg-[#B39DDB] text-white text-xs font-bold py-2 px-3 rounded-md shadow-lg hover:bg-[#9e86c8] transition-colors"
      >
        계정 : B (참여자)
      </button>
    </div>
  );
}