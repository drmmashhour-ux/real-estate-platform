type Props = {
  status: string;
  onRequestReview: () => void;
};

export function LegalWorkflowStatusBar({ status, onRequestReview }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white">Workflow status: <span className="font-semibold uppercase">{status}</span></p>
        <button type="button" onClick={onRequestReview} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10">Request review</button>
      </div>
    </div>
  );
}
