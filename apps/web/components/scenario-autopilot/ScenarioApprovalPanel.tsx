"use client";

export function ScenarioApprovalPanel(props: {
  runId: string | null;
  onApprove: () => void;
  onReject: (reason: string, revision: boolean) => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#2a2a2a] p-4">
      <p className="text-sm text-neutral-400">Approval gate — no production change until approved and executed.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!props.runId || props.busy}
          onClick={props.onApprove}
          className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          Approve
        </button>
        <RejectForm onSubmit={(reason, rev) => props.onReject(reason, rev)} disabled={!props.runId || props.busy} />
      </div>
    </div>
  );
}

function RejectForm(props: { onSubmit: (reason: string, revision: boolean) => void; disabled?: boolean }) {
  return (
    <form
      className="flex flex-1 flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const reason = String(fd.get("reason") ?? "");
        const revision = fd.get("revision") === "on";
        props.onSubmit(reason, revision);
      }}
    >
      <input
        name="reason"
        placeholder="Reject reason (required)"
        className="min-w-[12rem] flex-1 rounded border border-[#333] bg-[#111] px-3 py-2 text-sm"
        disabled={props.disabled}
      />
      <label className="flex items-center gap-2 text-xs text-neutral-500">
        <input name="revision" type="checkbox" disabled={props.disabled} />
        Request revision
      </label>
      <button
        type="submit"
        disabled={props.disabled}
        className="rounded-full border border-red-500/50 px-4 py-2 text-sm text-red-200 disabled:opacity-40"
      >
        Reject
      </button>
    </form>
  );
}
