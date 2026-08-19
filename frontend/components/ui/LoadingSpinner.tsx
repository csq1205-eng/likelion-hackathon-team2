export function LoadingSpinner({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-[#DCEFE9] border-t-[#6FCDB3] rounded-full animate-spin" />
      <p className="text-sm text-[#999]">{label}</p>
    </div>
  );
}