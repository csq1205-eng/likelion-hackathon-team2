export function StampGrid({
  title, count, emoji, color,
}: { title: string; count: number; emoji: string; color: "mint" | "purple" }) {
  const bg = color === "mint" ? "bg-[#C9EDE0]" : "bg-[#DCD6F7]";

  return (
    <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-sm font-bold mb-3">{title} {count}개</p>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center text-sm`}>
              {emoji}
            </div>
            <span className="text-[10px] text-[#999] mt-0.5">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}