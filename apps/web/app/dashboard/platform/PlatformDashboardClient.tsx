"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_MODULES } from "@lecipm/core";
import { listIntegrationPresets, planPartnerIntegration } from "@/modules/platform/integration.engine";
import type { ApiUsageRecord } from "@/lib/platform/api-usage";

export type PlatformPartnerRow = {
  id: string;
  name: string;
  type: string;
  maskedKey: string;
  webhookUrl?: string;
  scopes: string[];
};

export function PlatformDashboardClient({
  initialPartners,
  initialUsage,
}: {
  initialPartners: PlatformPartnerRow[];
  initialUsage: ApiUsageRecord[];
}) {
  const router = useRouter();
  const presets = useMemo(() => listIntegrationPresets(), []);
  const [selectedTool, setSelectedTool] = useState(presets[0]?.id ?? "salesforce");
  const plan = useMemo(() => planPartnerIntegration(selectedTool), [selectedTool]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-3 border-b border-[#D4AF37]/25 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Platform</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">API usage & partner integrations</h1>
        <p className="text-sm text-zinc-500">
          Internal services live in <code className="text-zinc-400">packages/api/internal</code>. Public routes require
          scoped API keys — no substitute for production key management (rotation, hashing, audit).
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Refresh
        </button>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Product modules</h2>
        <p className="mt-1 text-xs text-zinc-500">From <code className="text-zinc-400">@lecipm/core</code></p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PLATFORM_MODULES.map((m) => (
            <div key={m.id} className="rounded-lg border border-zinc-800 bg-black/30 p-4 text-sm">
              <p className="font-semibold text-white">{m.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{m.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                Services: {m.services.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Partners & keys</h2>
        <div className="mt-4 space-y-4">
          {initialPartners.map((p) => (
            <div key={p.id} className="rounded-lg border border-zinc-800 bg-black/30 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{p.name}</p>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                  {p.type}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                id: <code className="text-zinc-400">{p.id}</code> · key:{" "}
                <code className="text-zinc-400">{p.maskedKey}</code>
              </p>
              {p.webhookUrl && (
                <p className="mt-1 text-xs text-zinc-500">
                  webhook: <code className="text-zinc-400">{p.webhookUrl}</code>
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-400">Scopes: {p.scopes.join(", ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Recent public API calls (in-memory)</h2>
        <p className="mt-1 text-xs text-zinc-500">Populated when routes under /api/public/* are invoked.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="pb-2">Time</th>
                <th className="pb-2">Partner</th>
                <th className="pb-2">Route</th>
                <th className="pb-2">Method</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {initialUsage.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-500">
                    No calls recorded yet.
                  </td>
                </tr>
              ) : (
                initialUsage.map((u) => (
                  <tr key={u.id} className="border-t border-zinc-800/80">
                    <td className="py-2 pr-2 font-mono text-xs">{u.at}</td>
                    <td className="py-2 pr-2">{u.partnerId}</td>
                    <td className="py-2 pr-2">{u.route}</td>
                    <td className="py-2">{u.method}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Integration presets</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Planning helper from <code className="text-zinc-400">integration.engine.ts</code> — not live connector config.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTool(t.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                selectedTool === t.id
                  ? "border-[#D4AF37]/60 text-[#D4AF37]"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        {plan && (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-400">
            <p className="font-medium text-white">{plan.tool.name}</p>
            <p className="mt-2 text-xs text-zinc-500">Suggested scopes</p>
            <p className="mt-1 text-zinc-300">{plan.suggestedScopes.join(", ")}</p>
            <p className="mt-3 text-xs text-zinc-500">Data flows</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {plan.dataFlows.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">Prerequisites</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {plan.prerequisites.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
