export function SignatureReadinessCard({ ready, reasons }: { ready: boolean; reasons: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Signature readiness</p>
      <p className={`mt-1 text-xs ${ready ? "text-emerald-200" : "text-rose-200"}`}>{ready ? "Ready" : "Blocked"}</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}
