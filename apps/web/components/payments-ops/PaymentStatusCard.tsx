"use client";

export function PaymentStatusCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
      <h4 className="text-sm font-medium text-zinc-200">{title}</h4>
      <div className="mt-2 text-xs text-zinc-400">{children}</div>
    </div>
  );
}
