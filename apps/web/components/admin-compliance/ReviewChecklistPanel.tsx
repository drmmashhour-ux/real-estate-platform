/**
 * Checklist editing is performed via POST /api/admin/reviews/[id]/checklist from a dedicated review detail UI.
 * Overview surfaces status counts only to keep this workspace readable.
 */
export function ReviewChecklistPanel(props: {
  pending: number;
  passed: number;
  failed: number;
}) {
  const { pending, passed, failed } = props;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Checklist (aggregate)</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-semibold text-zinc-200">{pending}</p>
          <p className="text-[10px] uppercase text-zinc-500">Pending</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-emerald-300/90">{passed}</p>
          <p className="text-[10px] uppercase text-zinc-500">Pass</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-red-300/90">{failed}</p>
          <p className="text-[10px] uppercase text-zinc-500">Fail</p>
        </div>
      </div>
    </div>
  );
}
