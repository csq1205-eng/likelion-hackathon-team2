export function WPuzzle({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="relative w-full flex justify-center py-6">
      <div className="relative" style={{ width: 260, height: 160 }}>
        {/* 배경 W (연한 회색) */}
        <svg viewBox="0 0 260 160" className="absolute inset-0 w-full h-full">
          <text
            x="50%" y="50%"
            textAnchor="middle" dominantBaseline="central"
            fontSize="150" fontWeight="800" fontFamily="sans-serif"
            fill="#E5E5E5"
          >
            W
          </text>
        </svg>

        {/* 채워지는 W (민트) — 아래에서부터 percent만큼만 보이게 클리핑 */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(${100 - clamped}% 0 0 0)` }}
        >
          <svg viewBox="0 0 260 160" className="w-full h-full">
            <text
              x="50%" y="50%"
              textAnchor="middle" dominantBaseline="central"
              fontSize="150" fontWeight="800" fontFamily="sans-serif"
              fill="#6FCDB3"
            >
              W
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}