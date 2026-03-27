"use client";

export function TuningProfilePanel({
  onCreate,
  busy,
}: {
  onCreate: (payload: { name: string; description: string; validationRunId: string; configJson: string }) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">New tuning profile</p>
      <p className="mt-1 text-xs text-zinc-600">
        Paste JSON for <code className="text-amber-200/80">TuningProfileConfig</code> (thresholds, multipliers, penalties, eliteRecommendation).
      </p>
      <div className="mt-3 space-y-2">
        <input
          placeholder="Name"
          className="w-full rounded border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-200"
          id="tp-name"
        />
        <input
          placeholder="Description"
          className="w-full rounded border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-200"
          id="tp-desc"
        />
        <input
          placeholder="Based-on validation run ID"
          className="w-full rounded border border-zinc-700 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200"
          id="tp-run"
        />
        <textarea
          placeholder='{"trustBucketThresholds":{"mediumMin":40,"highMin":65,"verifiedMin":85}}'
          rows={8}
          className="w-full rounded border border-zinc-700 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200"
          id="tp-config"
          defaultValue="{}"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const name = (document.getElementById("tp-name") as HTMLInputElement)?.value ?? "";
            const description = (document.getElementById("tp-desc") as HTMLInputElement)?.value ?? "";
            const validationRunId = (document.getElementById("tp-run") as HTMLInputElement)?.value ?? "";
            const configJson = (document.getElementById("tp-config") as HTMLTextAreaElement)?.value ?? "{}";
            onCreate({ name, description, validationRunId, configJson });
          }}
          className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-900/50 disabled:opacity-50"
        >
          Create profile
        </button>
      </div>
    </div>
  );
}
