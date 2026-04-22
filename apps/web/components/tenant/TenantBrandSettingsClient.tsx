"use client";

import { useMemo, useState } from "react";

export type TenantBrandFormRow = {
  tenantId: string;
  tenantName: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
};

export default function TenantBrandSettingsClient({
  tenants,
}: {
  tenants: TenantBrandFormRow[];
}) {
  const initial = tenants[0];
  const [tenantId, setTenantId] = useState(() => initial?.tenantId ?? "");
  const [form, setForm] = useState({
    displayName: initial?.displayName ?? "",
    primaryColor: initial?.primaryColor ?? "#D4AF37",
    secondaryColor: initial?.secondaryColor ?? "#000000",
    accentColor: initial?.accentColor ?? "#ffffff",
    heroTitle: initial?.heroTitle ?? "",
    heroSubtitle: initial?.heroSubtitle ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const active = useMemo(() => tenants.find((t) => t.tenantId === tenantId), [tenants, tenantId]);

  function applyTenant(nextId: string) {
    const t = tenants.find((x) => x.tenantId === nextId);
    setTenantId(nextId);
    if (t) {
      setForm({
        displayName: t.displayName,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        accentColor: t.accentColor,
        heroTitle: t.heroTitle,
        heroSubtitle: t.heroSubtitle,
      });
    }
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const r = await fetch("/api/tenant/brand/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          displayName: form.displayName,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          heroTitle: form.heroTitle || null,
          heroSubtitle: form.heroSubtitle || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Save failed");
      }
      setStatus("saved");
      setMessage("Saved.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Error");
    }
  }

  if (!initial) {
    return (
      <div className="p-6 text-white/70">
        No tenant workspaces linked to your account yet. Ask your administrator for an invitation.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="text-3xl font-bold text-[#D4AF37]">Tenant branding</h1>
        <p className="mt-1 text-sm text-white/55">
          White-label colors and hero copy for your agency portal ({active?.tenantName ?? ""}).
        </p>
      </div>

      {tenants.length > 1 ? (
        <label className="block text-sm text-white/70">
          Workspace
          <select
            className="mt-1 w-full max-w-md rounded-xl border border-white/10 bg-black p-3"
            value={tenantId}
            onChange={(e) => applyTenant(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.tenantId} value={t.tenantId}>
                {t.tenantName}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          className="rounded-xl border border-white/10 bg-black p-3"
          placeholder="Display name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <input
          className="rounded-xl border border-white/10 bg-black p-3"
          placeholder="Hero title"
          value={form.heroTitle}
          onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
        />
        <input
          className="rounded-xl border border-white/10 bg-black p-3 md:col-span-2"
          placeholder="Hero subtitle"
          value={form.heroSubtitle}
          onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
        />
        <input
          className="h-12 rounded-xl border border-white/10 bg-black p-2"
          type="color"
          aria-label="Primary color"
          value={form.primaryColor}
          onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
        />
        <input
          className="h-12 rounded-xl border border-white/10 bg-black p-2"
          type="color"
          aria-label="Secondary color"
          value={form.secondaryColor}
          onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
        />
        <input
          className="h-12 rounded-xl border border-white/10 bg-black p-2"
          type="color"
          aria-label="Accent color"
          value={form.accentColor}
          onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
        />
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={status === "saving"}
        className="rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-black disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save branding"}
      </button>

      {message ? <p className="text-sm text-white/60">{message}</p> : null}
    </div>
  );
}
