"use client";

type Props = {
  label: string;
  children: React.ReactNode;
};

export function DreamHomeTraitCard({ label, children }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold/90">{label}</p>
      <div className="mt-2 text-sm text-slate-200">{children}</div>
    </div>
  );
}
