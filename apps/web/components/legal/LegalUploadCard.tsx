"use client";

import { useMemo, useState } from "react";

export type LegalUploadWorkflowOption = {
  workflowType: string;
  title: string;
  requirements: Array<{ id: string; label: string }>;
};

type Props = {
  actorType: string;
  workflows: LegalUploadWorkflowOption[];
  enabled: boolean;
  onUploaded?: () => void;
};

export function LegalUploadCard({ actorType, workflows, enabled, onUploaded }: Props) {
  const [workflowType, setWorkflowType] = useState(workflows[0]?.workflowType ?? "");
  const [requirementId, setRequirementId] = useState(workflows[0]?.requirements[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedWf = useMemo(
    () => workflows.find((w) => w.workflowType === workflowType),
    [workflows, workflowType],
  );

  if (!enabled || workflows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-[#9CA3AF]">
        Uploads are unavailable for your current segment or configuration.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!file || !workflowType || !requirementId) {
      setMsg({ ok: false, text: "Choose a workflow, checklist item, and file." });
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("workflowType", workflowType);
      fd.append("requirementId", requirementId);
      fd.append("actorType", actorType);

      const res = await fetch("/api/legal/document/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Upload failed." });
        return;
      }
      setMsg({ ok: true, text: "Uploaded. It is stored for operator review — not legal advice." });
      setFile(null);
      onUploaded?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-premium-gold/25 bg-[#121212] p-4">
      <h3 className="text-sm font-semibold text-premium-gold">Upload checklist evidence</h3>
      <p className="mt-1 text-xs text-[#9CA3AF]">
        PDF, JPG, or PNG only — max 10MB. Files are scanned before storage. This helps operators verify platform
        readiness; it does not constitute legal advice.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-[#D1D5DB]">
          Workflow
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            value={workflowType}
            onChange={(ev) => {
              const next = ev.target.value;
              setWorkflowType(next);
              const wf = workflows.find((w) => w.workflowType === next);
              setRequirementId(wf?.requirements[0]?.id ?? "");
            }}
          >
            {workflows.map((w) => (
              <option key={w.workflowType} value={w.workflowType}>
                {w.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[#D1D5DB]">
          Checklist item
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            value={requirementId}
            onChange={(ev) => setRequirementId(ev.target.value)}
          >
            {(selectedWf?.requirements ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[#D1D5DB]">
          File
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="mt-1 block w-full text-sm text-[#D1D5DB] file:mr-3 file:rounded-lg file:border-0 file:bg-premium-gold/20 file:px-3 file:py-2 file:text-sm file:text-premium-gold"
            onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-premium-gold/90 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
      {msg ? (
        <p className={`mt-3 text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      ) : null}
    </div>
  );
}
