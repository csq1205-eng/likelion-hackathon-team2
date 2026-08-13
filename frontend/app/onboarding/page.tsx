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
  { code: "SKINCARE", label: "스킨케어" },
  { code: "BODY", label: "바디" },
  { code: "CLEANSING", label: "클렌징" },
  { code: "ETC", label: "기타" },
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
      router.push("/mission");
    } catch (err) {
      alert("저장에 실패했어요. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <p>{step} / 4</p>

      {step === 1 && (
        <div>
          <h2>요즘 제일 신경 쓰이는 건?</h2>
          {CONCERNS.map((c) => (
            <button key={c.code} onClick={() => setMainConcern(c.code)}
              style={{ fontWeight: mainConcern === c.code ? "bold" : "normal" }}>
              {c.label}
            </button>
          ))}
          <div><button onClick={() => setStep(2)} disabled={!mainConcern}>다음</button></div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>혹시 이런 게 원인일 수도 있어요</h2>
          {CAUSES.map((c) => (
            <button key={c.code} onClick={() => toggleCause(c.code)}
              style={{ fontWeight: causeCandidates.includes(c.code) ? "bold" : "normal" }}>
              {c.label}
            </button>
          ))}
          <div>
            <button onClick={() => setStep(1)}>이전</button>
            <button onClick={() => setStep(3)}>다음</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>생활 패턴을 알려주세요</h2>
          <label>평균 수면시간(h)
            <input type="number" step={0.5} value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))} />
          </label>
          <label>물 섭취량(L)
            <input type="number" step={0.1} value={waterIntake}
              onChange={(e) => setWaterIntake(Number(e.target.value))} />
          </label>
          <label>기상 시간
            <input type="time" value={wakeUpTime} onChange={(e) => setWakeUpTime(e.target.value)} />
          </label>
          <label>취침 시간
            <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
          </label>
          <div>
            <button onClick={() => setStep(2)}>이전</button>
            <button onClick={() => setStep(4)}>다음</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2>보유 중인 제품이 있나요?</h2>
          {PRODUCT_CATEGORIES.map((p) => (
            <div key={p.code}>
              <span>{p.label}</span>
              <button onClick={() => setOwnedProducts((prev) => ({ ...prev, [p.code]: true }))}
                style={{ fontWeight: ownedProducts[p.code] === true ? "bold" : "normal" }}>있음</button>
              <button onClick={() => setOwnedProducts((prev) => ({ ...prev, [p.code]: false }))}
                style={{ fontWeight: ownedProducts[p.code] === false ? "bold" : "normal" }}>없음</button>
            </div>
          ))}
          <div>
            <button onClick={() => setStep(3)}>이전</button>
            <button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "저장 중..." : "완료"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}