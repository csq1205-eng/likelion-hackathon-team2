"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { withdrawUser } from "@/lib/api/withdrawal";
import { Button } from "@/components/ui/Button";

const REASONS = [
  "서비스를 더 이상 사용하지 않아요",
  "원하는 미션이 없어요",
  "그룹 활동이 부담스러워요",
  "기타",
];

export default function WithdrawPage() {
  const router = useRouter();
  const { accessToken, userId } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw() {
    if (!accessToken || !userId) return;
    setSubmitting(true);
    setError(null);
    try {
      await withdrawUser(userId, reason, accessToken);
      localStorage.removeItem("welllog_auth");
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("탈퇴 처리에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[28px] p-7 shadow-sm">
        <h1 className="text-lg font-bold mb-2">정말 탈퇴하시겠어요?</h1>
        <p className="text-sm text-[#888] mb-6">
          계정과 개인 데이터가 삭제돼요. 그룹 활동 기록은 통계상 유지되지만
          "알 수 없음"으로 표시돼요.
        </p>

        <p className="text-sm font-medium mb-3">탈퇴 이유를 알려주세요</p>
        <div className="space-y-2 mb-6">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm ${
                reason === r
                  ? "bg-[#C9EDE0] border-2 border-[#6FCDB3] text-[#1F6F5C]"
                  : "bg-[#F0F0F0] border-2 border-transparent text-[#555]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 mb-6 text-sm text-[#666]">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
          />
          안내 사항을 모두 확인했으며 탈퇴에 동의합니다
        </label>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

     <Button variant="danger" onClick={handleWithdraw} disabled={!confirmChecked || submitting}>
  {submitting ? "처리 중..." : "탈퇴하기"}
</Button>
<button onClick={() => router.back()} className="w-full py-3 mt-2 text-sm text-[#999]">
  취소
</button>
      </div>
    </div>
  );
}