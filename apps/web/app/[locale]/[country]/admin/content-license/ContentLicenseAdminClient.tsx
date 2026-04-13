"use client";

import { useCallback, useEffect, useState } from "react";

export function ContentLicenseAdminClient() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/content-license", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; currentVersion?: string; error?: string };
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Could not load policy");
        return;
      }
      if (j.currentVersion) {
        setCurrentVersion(j.currentVersion);
        setDraft((d) => (d.trim() === "" ? j.currentVersion ?? "" : d));
      }
    } catch {
      setErr("Could not load policy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const nextV = draft.trim();
    if (!nextV) {
      setErr("Enter a version string (e.g. 1.0.1).");
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/content-license", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentVersion: nextV }),
      });
      const j = (await res.json()) as { ok?: boolean; currentVersion?: string; error?: string };
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Update failed");
        return;
      }
      setCurrentVersion(j.currentVersion ?? nextV);
      setMsg("Version updated. All users must accept the new license on their next gated action.");
    } catch {
      setErr("Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-white">Platform Content &amp; Usage License</h2>
      <p className="mt-2 text-sm text-slate-400">
        The required version is stored in the database. When you bump it, users who have only accepted an older
        version are prompted again before listing content, bookings, first messages, and broker lead actions.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active required version</p>
            <p className="mt-1 font-mono text-lg text-emerald-300">{currentVersion ?? "—"}</p>
          </div>
          <div>
            <label htmlFor="cl-next" className="text-xs font-medium text-slate-400">
              New required version
            </label>
            <input
              id="cl-next"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. 1.0.1"
              className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600"
            />
          </div>
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          {msg ? <p className="text-sm text-emerald-300/90">{msg}</p> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Bump version & force re-acceptance"}
          </button>
        </div>
      )}
    </div>
  );
}
