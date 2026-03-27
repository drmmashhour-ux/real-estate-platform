"use client";

import { useState } from "react";

export type OrganizationSettingsProps = {
  workspaceId: string;
  initialName: string;
  initialSettings: Record<string, unknown> | null;
  canEdit: boolean;
  onSaved?: () => void;
};

export function OrganizationSettings({
  workspaceId,
  initialName,
  initialSettings,
  canEdit,
  onSaved,
}: OrganizationSettingsProps) {
  const [name, setName] = useState(initialName);
  const perSeat =
    typeof initialSettings?.perSeatPricingEnabled === "boolean"
      ? initialSettings.perSeatPricingEnabled
      : false;
  const [perSeatEnabled, setPerSeatEnabled] = useState(perSeat);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          settings: { perSeatPricingEnabled: perSeatEnabled },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNote(data.error ?? "Save failed");
        return;
      }
      setNote("Saved.");
      onSaved?.();
    } catch {
      setNote("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C9A646]/90">Organization settings</h2>
      <p className="mt-1 text-xs text-slate-500">
        Workspace is the tenancy boundary for deals, leads, documents, and AI actions. Subscription billing can be linked
        per workspace; optional per-seat pricing is stored in settings.
      </p>
      {canEdit ? (
        <form className="mt-4 space-y-4" onSubmit={save}>
          <label className="block text-sm">
            <span className="text-slate-400">Organization name</span>
            <input
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              className="mt-1 w-full max-w-md rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={perSeatEnabled} onChange={(ev) => setPerSeatEnabled(ev.target.checked)} />
            Enable per-seat pricing (reporting / Stripe mapping — configure in billing)
          </label>
          {note ? <p className="text-sm text-emerald-400/90">{note}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-slate-500">You have read-only access to this organization.</p>
      )}
    </section>
  );
}
