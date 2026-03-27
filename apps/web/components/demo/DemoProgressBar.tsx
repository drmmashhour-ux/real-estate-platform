"use client";

export function DemoProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#C9A646] transition-[width] duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
