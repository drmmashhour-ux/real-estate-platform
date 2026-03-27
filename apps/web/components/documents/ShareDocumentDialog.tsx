"use client";

import { useEffect, useState } from "react";

const VIS_OPTIONS = [
  "PRIVATE_INTERNAL",
  "SHARED_PARTICIPANTS",
  "BROKER_ONLY",
  "CLIENT_VISIBLE",
  "ADMIN_ONLY",
] as const;

export function ShareDocumentDialog({
  fileId,
  onClose,
  onSaved,
}: {
  fileId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [visibility, setVisibility] = useState<string>("PRIVATE_INTERNAL");
  const [grantsText, setGrantsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/documents/files/${encodeURIComponent(fileId)}`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as {
        file?: { visibility: string; accessGrants?: { userId: string }[] };
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Failed to load");
        setLoading(false);
        return;
      }
      if (j.file) {
        setVisibility(j.file.visibility);
        setGrantsText((j.file.accessGrants ?? []).map((g) => g.userId).join(", "));
      }
      setLoading(false);
    })();
  }, [fileId]);

  async function save() {
    setErr(null);
    const visRes = await fetch(`/api/documents/files/${encodeURIComponent(fileId)}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ visibility }),
    });
    if (!visRes.ok) {
      const j = (await visRes.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not update visibility");
      return;
    }
    const ids = grantsText
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const grants = ids.map((userId) => ({ userId, access: "VIEW" as const }));
    const accRes = await fetch(`/api/documents/files/${encodeURIComponent(fileId)}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ grants }),
    });
    if (!accRes.ok) {
      const j = (await accRes.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not update access");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
        <h2 className="text-lg font-medium text-white">Share document</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <label className="mt-4 block text-sm text-slate-400">
              Visibility
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                {VIS_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm text-slate-400">
              Extra user IDs (comma-separated) — explicit view grants
              <textarea
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100"
                rows={3}
                value={grantsText}
                onChange={(e) => setGrantsText(e.target.value)}
                placeholder="user-uuid, user-uuid"
              />
            </label>
            {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
                onClick={() => void save()}
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
