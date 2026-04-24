"use client";

export function ScenarioRollbackPanel(props: {
  runId: string | null;
  reversible?: boolean;
  onRollback: (reason: string) => void;
  busy?: boolean;
}) {
  if (!props.reversible) {
    return (
      <p className="text-sm text-amber-200/80">
        Rollback: not available for this scenario (flagged non-reversible) — use manual playbooks.
      </p>
    );
  }
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const reason = String(fd.get("reason") ?? "");
        props.onRollback(reason);
      }}
    >
      <input
        name="reason"
        placeholder="Reason for rollback"
        className="min-w-[14rem] flex-1 rounded border border-[#333] bg-[#111] px-3 py-2 text-sm"
        disabled={!props.runId || props.busy}
      />
      <button
        type="submit"
        disabled={!props.runId || props.busy}
        className="rounded-full border border-amber-600/50 px-4 py-2 text-sm text-amber-100 disabled:opacity-40"
      >
        Mark reversed
      </button>
    </form>
  );
}
