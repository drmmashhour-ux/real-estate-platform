export type FinancialCardProps = {
  title: string;
  value: string;
  sub?: string;
};

export function FinancialCard({ title, value, sub }: FinancialCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="mt-1 text-xl font-semibold text-[#D4AF37]">{value}</h2>
      {sub ? <p className="mt-1 text-sm text-emerald-400/90">{sub}</p> : null}
    </div>
  );
}
