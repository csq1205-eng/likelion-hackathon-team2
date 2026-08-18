"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { saveOnboarding } from "@/lib/api/onboarding";

const CONCERNS = [
  { code: "TROUBLE", label: "트러블" },
  { code: "DRYNESS", label: "건조함" },
  { code: "DULLNESS", label: "칙칙함" },
  { code: "ETC", label: "기타" },
];

const CAUSES = [
  { code: "STAMINA_DROP", label: "체력저하" },
  { code: "DIET", label: "식습관·다이어트" },
  { code: "SLEEP_LACK", label: "수면부족" },
  { code: "STRESS", label: "스트레스" },
  { code: "NIGHT_WORK", label: "야근" },
  { code: "WATER_LACK", label: "물부족" },
  { code: "UV_EXPOSURE", label: "자외선노출" },
];

const PRODUCT_CATEGORIES = [
  { code: "SKINCARE", label: "스킨케어", desc: "토너, 앰플, 크림 등" },
  { code: "BODY", label: "바디", desc: "바디워시, 바디로션, 바디미스트 등" },
  { code: "CLEANSING", label: "클렌징", desc: "클렌징폼, 클렌징오일, 클렌징워터 등" },
  { code: "ETC", label: "기타", desc: "그 외 사용 중인 제품" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [step, setStep] = useState(1);
  const [mainConcern, setMainConcern] = useState<string>("");
  const [causeCandidates, setCauseCandidates] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState(1.0);
  const [wakeUpTime, setWakeUpTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("00:00");
  const [ownedProducts, setOwnedProducts] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  function toggleCause(code: string) {
    setCauseCandidates((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleSubmit() {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await saveOnboarding(
        {
          mainConcern,
          causeCandidates,
          sleepHours,
          waterIntake,
          wakeUpTime,
          sleepTime,
          preferredMissionTypes: [],
          avoidedMissionTypes: [],
          ownedProducts: PRODUCT_CATEGORIES.map((p) => ({
            category: p.code,
            hasProduct: ownedProducts[p.code] ?? false,
          })),
        },
        accessToken
      );
      router.push("/fe-d/mission");
    } catch (err) {
      alert("저장에 실패했어요. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      void handleSubmit();
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#F4F6F5] px-4 py-8">
      <div className="flex w-full max-w-sm flex-col rounded-3xl bg-white px-6 py-7 shadow-[0_8px_30px_rgba(31,42,37,0.06)]">
        {/* 진행 표시 */}
        <div className="mb-7">
          <p className="mb-2.5 text-sm text-[#8A9A92]">정보 입력</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-[#7BD4B0]" : "bg-[#E6E9E8]"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-right text-xs font-medium text-[#B4BFB9]">{step}/3</p>
        </div>

        {/* 1단계: mainConcern + causeCandidates */}
        {step === 1 && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-[#1F2A25] text-balance">
              당신에 대해 알려주세요!
            </h1>

            <p className="mb-3 text-sm text-[#8A9A92]">요즘 제일 신경 쓰이는 건?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CONCERNS.map((c) => {
                const selected = mainConcern === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setMainConcern(c.code)}
                    className={`w-full rounded-[10px] px-4 py-3 text-center text-sm font-medium transition-colors ${
                      selected
                        ? "border border-[#86D9B5] bg-[#EAF8F1] text-[#2E9C74]"
                        : "border border-transparent bg-[#F1F3F2] text-[#4B5851]"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-6 mb-3 text-sm text-[#8A9A92]">
              혹시 최근 이런 게 있었나요? (복수 선택 가능)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CAUSES.map((c) => {
                const selected = causeCandidates.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCause(c.code)}
                    className={`w-full rounded-[10px] px-4 py-3 text-center text-sm font-medium transition-colors ${
                      selected
                        ? "border border-[#86D9B5] bg-[#EAF8F1] text-[#2E9C74]"
                        : "border border-transparent bg-[#F1F3F2] text-[#4B5851]"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2단계: 수면/물/기상/취침 */}
        {step === 2 && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-[#1F2A25] text-balance">
              당신에 대해 알려주세요!
            </h1>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B3A33]">
                  평균 수면시간
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="숫자 선택"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full rounded-[10px] border border-transparent bg-[#F2F4F3] px-4 py-3.5 text-sm text-[#2B3A33] outline-none transition-colors placeholder:text-[#AAB4AE] focus:border-[#86D9B5] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B3A33]">
                  물 섭취량
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="입력"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(Number(e.target.value))}
                  className="w-full rounded-[10px] border border-transparent bg-[#F2F4F3] px-4 py-3.5 text-sm text-[#2B3A33] outline-none transition-colors placeholder:text-[#AAB4AE] focus:border-[#86D9B5] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B3A33]">
                  기상 시간
                </label>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="w-full rounded-[10px] border border-transparent bg-[#F2F4F3] px-4 py-3.5 text-sm text-[#2B3A33] outline-none transition-colors focus:border-[#86D9B5] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B3A33]">
                  취침 시간
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full rounded-[10px] border border-transparent bg-[#F2F4F3] px-4 py-3.5 text-sm text-[#2B3A33] outline-none transition-colors focus:border-[#86D9B5] focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3단계: 보유 제품 있음/없음 */}
        {step === 3 && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-[#1F2A25] text-balance">
              지금 쓰고 있는 제품이 있나요?
            </h1>

            <div className="space-y-3">
              {PRODUCT_CATEGORIES.map((cat) => {
                const owned = ownedProducts[cat.code];
                return (
                  <div key={cat.code} className="rounded-2xl bg-[#F2F4F3] px-4 py-4">
                    <p className="text-sm font-bold text-[#2B3A33]">{cat.label}</p>
                    <p className="mt-0.5 text-xs text-[#9AA8A1]">{cat.desc}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        aria-pressed={owned === true}
                        onClick={() =>
                          setOwnedProducts((prev) => ({ ...prev, [cat.code]: true }))
                        }
                        className={`rounded-full px-6 py-1.5 text-sm font-medium transition-colors ${
                          owned === true
                            ? "bg-[#CDEEDF] text-[#2E9C74]"
                            : "border border-[#E6E9E8] bg-white text-[#8A968F]"
                        }`}
                      >
                        있음
                      </button>
                      <button
                        type="button"
                        aria-pressed={owned === false}
                        onClick={() =>
                          setOwnedProducts((prev) => ({ ...prev, [cat.code]: false }))
                        }
                        className={`rounded-full px-6 py-1.5 text-sm font-medium transition-colors ${
                          owned === false
                            ? "bg-[#CDEEDF] text-[#2E9C74]"
                            : "border border-[#E6E9E8] bg-white text-[#8A968F]"
                        }`}
                      >
                        없음
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 다음 / 제출 */}
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="mt-8 w-full rounded-full bg-[#9EE0C6] py-4 text-base font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {step === 3 && submitting ? "저장 중..." : "다음"}
        </button>
      </div>
    </main>
  );
}