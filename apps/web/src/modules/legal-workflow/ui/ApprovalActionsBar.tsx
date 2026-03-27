type Props = {
  onApprove: () => void;
  onRequestChanges: () => void;
  onFlagRisk: () => void;
};

export function ApprovalActionsBar({ onApprove, onRequestChanges, onFlagRisk }: Props) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <button type="button" onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500">Approve</button>
      <button type="button" onClick={onRequestChanges} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/20">Request changes</button>
      <button type="button" onClick={onFlagRisk} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-rose-500/20">Flag risk</button>
    </div>
  );
}
