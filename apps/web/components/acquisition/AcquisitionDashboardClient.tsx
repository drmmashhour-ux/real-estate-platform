"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ACQUISITION_MESSAGE_TEMPLATES } from "@/modules/acquisition/acquisition-templates";
import type { AcquisitionContactVm, AcquisitionDashboardVm } from "@/modules/acquisition/acquisition.types";
import { KANBAN_COLUMNS } from "@/modules/acquisition/acquisition.constants";

export function AcquisitionDashboardClient({
  localeCountryPrefix,
  initial,
}: {
  localeCountryPrefix: string;
  initial: AcquisitionDashboardVm;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function post(path: string, body?: object) {
    setBusy(path);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("BROKER");
  const [source, setSource] = useState<string>("manual");

  function Card({ c }: { c: AcquisitionContactVm }) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-white">{c.name}</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">{c.type}</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">{c.email ?? "—"} · {c.phone ?? "—"}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            disabled={!!busy || c.pipelineStage === "CONVERTED" || c.pipelineStage === "LOST"}
            className="rounded bg-emerald-900/70 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-800"
            onClick={() => void post(`/api/dashboard/acquisition/contacts/${c.id}/advance`)}
          >
            Next stage
          </button>
          <button
            type="button"
            disabled={!!busy}
            className="rounded bg-red-950/70 px-2 py-1 text-[11px] text-red-200 hover:bg-red-900"
            onClick={() => void post(`/api/dashboard/acquisition/contacts/${c.id}/lost`)}
          >
            Lost
          </button>
          <button
            type="button"
            disabled={!!busy}
            className="rounded border border-amber-700/50 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-950/50"
            onClick={() =>
              void (async () => {
                setBusy("inv");
                try {
                  const res = await fetch(`/api/dashboard/acquisition/invites`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contactId: c.id }),
                  });
                  const j = (await res.json()) as { code?: string };
                  if (j.code && typeof window !== "undefined") {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/invite?code=${encodeURIComponent(j.code)}`,
                    );
                  }
                  if (res.ok) router.refresh();
                } finally {
                  setBusy(null);
                }
              })()
            }
          >
            Invite link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href={`${localeCountryPrefix}/dashboard/acquisition/call`}
          className="text-sm text-amber-200/90 underline-offset-4 hover:underline"
        >
          Call script assist
        </a>
      </div>
      <section className="rounded-2xl border border-emerald-900/40 bg-zinc-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">Early traction metrics</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Contacts tracked</dt>
            <dd className="font-mono text-xl text-white">{initial.metrics.totalContacts}</dd>
          </div>
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Avg leads / contact</dt>
            <dd className="font-mono text-xl text-white">{initial.metrics.avgLeadsPerContact.toFixed(2)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Avg revenue / converted (¢)</dt>
            <dd className="font-mono text-xl text-white">{initial.metrics.avgRevenuePerConvertedCents}</dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {Object.entries(initial.metrics.conversionRateByType).map(([t, rate]) => (
            <div key={t} className="flex justify-between text-xs text-zinc-400">
              <span>Conversion · {t}</span>
              <span className="font-mono text-emerald-300">{(rate * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">
          Unread internal notifications (new contact / conversion / onboarding complete):{" "}
          <span className="font-mono text-zinc-300">{initial.unreadNotifications}</span>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Pipeline board</h2>
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="flex min-w-[900px] gap-4 lg:min-w-0 lg:grid lg:grid-cols-6">
          {KANBAN_COLUMNS.map((col) => (
            <div key={col} className="min-h-[220px] min-w-[160px] shrink-0 rounded-xl border border-white/10 bg-black/30 p-3 lg:min-w-0">
              <h3 className="border-b border-white/10 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {col.replace(/_/g, " ")}
                <span className="ml-2 font-mono text-white">({initial.pipeline[col]?.length ?? 0})</span>
              </h3>
              <div className="mt-3 space-y-2">
                {(initial.pipeline[col] ?? []).map((c) => (
                  <Card key={c.id} c={c} />
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">Add contact</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-zinc-400">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-zinc-400">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="BROKER">Broker</option>
                <option value="HOST">Host</option>
                <option value="RESIDENCE">Residence</option>
                <option value="USER">User</option>
              </select>
            </label>
            <label className="block text-xs text-zinc-400">
              Source
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="manual">manual</option>
                <option value="referral">referral</option>
                <option value="event">event</option>
              </select>
            </label>
            <button
              type="button"
              disabled={!!busy || !name.trim()}
              className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              onClick={() =>
                void post(`/api/dashboard/acquisition/contacts`, {
                  name: name.trim(),
                  type,
                  source,
                })
              }
            >
              Save contact
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">Message templates</h2>
          <ul className="mt-4 space-y-4 text-sm text-zinc-300">
            {ACQUISITION_MESSAGE_TEMPLATES.map((t) => (
              <li key={t.kind} className="rounded-lg border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t.kind}</p>
                <p className="mt-1 font-medium text-white">{t.headline}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Contacts (full list)</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Leads</th>
                <th className="px-4 py-2">Revenue ¢</th>
              </tr>
            </thead>
            <tbody>
              {initial.contacts.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-2">{c.pipelineStage}</td>
                  <td className="px-4 py-2 font-mono">{c.leadsGenerated}</td>
                  <td className="px-4 py-2 font-mono">{c.revenueCents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Onboarding progress (linked users)</h2>
        <ul className="mt-4 space-y-3">
          {initial.onboardingSamples.length === 0 ? (
            <li className="text-sm text-zinc-500">Link invitees to platform users to show progress.</li>
          ) : (
            initial.onboardingSamples.map((o) => (
              <li key={o.userId} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-400">{o.userId.slice(0, 10)}…</span>
                  <span className="font-semibold text-emerald-300">{o.completionPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full bg-emerald-600 transition-all" style={{ width: `${o.completionPercent}%` }} />
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="text-center text-[11px] text-zinc-600">
        Mobile: <span className="font-mono">{localeCountryPrefix}/api/mobile/acquisition/summary</span> (admin) · onboarding status for signed-in users via{" "}
        <span className="font-mono">/api/mobile/acquisition/onboarding</span>
      </p>
    </div>
  );
}
