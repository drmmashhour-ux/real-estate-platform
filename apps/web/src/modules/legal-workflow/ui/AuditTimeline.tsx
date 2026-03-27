type Audit = {
  id: string;
  actionType: string;
  actorUserId: string;
  createdAt: string | Date;
  metadata?: Record<string, unknown> | null;
};

export function AuditTimeline({ items }: { items: Audit[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Audit timeline</p>
      <ul className="mt-2 space-y-2 text-xs text-slate-300">
        {items.length ? items.map((a) => (
          <li key={a.id} className="rounded-md bg-white/5 px-2 py-1">
            <div className="flex items-center justify-between gap-2">
              <span>{a.actionType.replace(/_/g, " ")}</span>
              <span className="text-slate-500">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-slate-500">{a.actorUserId}</div>
            {a.metadata ? <div className="mt-1 text-[11px] text-slate-400">{JSON.stringify(a.metadata)}</div> : null}
          </li>
        )) : <li className="text-slate-500">No audit events yet.</li>}
      </ul>
    </div>
  );
}
