"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TenantSettingsForm(props: {
  tenantId: string;
  initialName: string;
  initialSettings: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(props.initialName);
  const [settingsJson, setSettingsJson] = useState(
    props.initialSettings ? JSON.stringify(props.initialSettings, null, 2) : "{\n  \"branding\": {}\n}"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    let settings: unknown = null;
    try {
      settings = JSON.parse(settingsJson);
    } catch {
      setError("Settings must be valid JSON");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${props.tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), settings }),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "Save failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-slate-500">Workspace name</label>
        <input
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs text-slate-500">Defaults & branding (JSON)</label>
        <textarea
          className="mt-1 w-full min-h-[160px] rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs"
          value={settingsJson}
          onChange={(e) => setSettingsJson(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-40"
      >
        Save settings
      </button>
    </form>
  );
}
