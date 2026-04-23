type Pending = {
  id: string;
  actionType: string;
  targetEntityType: string;
  targetEntityId: string | null;
  createdAt: Date;
};

type Props = {
  pending: Pending[];
};

export function DarlinkAutonomyApprovalQueue(props: Props) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-950">Approval queue</h3>
      {props.pending.length === 0 ? (
        <p className="mt-2 text-sm text-amber-900/80">No pending marketplace autonomy approvals.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {props.pending.map((p) => (
            <li key={p.id} className="rounded-lg border border-amber-100 bg-white px-3 py-2">
              <p className="font-mono text-xs text-stone-900">{p.actionType}</p>
              <p className="text-xs text-stone-600">
                {p.targetEntityType}
                {p.targetEntityId ? ` · ${p.targetEntityId.slice(0, 10)}…` : ""}
              </p>
              <p className="text-[10px] text-stone-400">{p.createdAt.toISOString().slice(0, 16)} UTC</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-amber-900/80">
        Approve or reject via <code className="rounded bg-white px-1">POST /api/admin/autonomy/approve</code> or{" "}
        <code className="rounded bg-white px-1">reject</code> (admin session).
      </p>
    </section>
  );
}
