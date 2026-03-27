export function CaseCRMPanel({ crm }: { crm: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">CRM signals</p>
      <p className="mt-1 text-xs text-slate-300">Lead count: {crm?.leadCount ?? 0}</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">
        {(crm?.leads ?? []).map((l: any) => <li key={l.id}>{l.name} · score {l.score} · {l.pipelineStatus}</li>)}
      </ul>
    </div>
  );
}
