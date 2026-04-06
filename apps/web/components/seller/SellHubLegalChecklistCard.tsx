"use client";

import type { SellHubLegalChecklist } from "@/lib/fsbo/sell-hub-legal-checklist";

function statusClasses(status: "pass" | "warning" | "block") {
  if (status === "pass") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-rose-500/30 bg-rose-500/10 text-rose-300";
}

export function SellHubLegalChecklistCard({
  checklist,
  title = "Sell Hub legal checklist",
}: {
  checklist: SellHubLegalChecklist;
  title?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Unified legal readiness for authority, declaration, evidence, and publish approval.
          </p>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            checklist.publishReady
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {checklist.publishReady ? "Ready for approval" : "Blocked"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pass</p>
          <p className="mt-2 text-2xl font-semibold text-white">{checklist.counts.pass}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Warning</p>
          <p className="mt-2 text-2xl font-semibold text-white">{checklist.counts.warning}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Block</p>
          <p className="mt-2 text-2xl font-semibold text-white">{checklist.counts.block}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {checklist.items.map((item) => (
          <div key={item.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${statusClasses(item.status)}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      {checklist.blockingReasons.length > 0 ? (
        <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-300">Current blocking reasons</p>
          <ul className="mt-3 space-y-2 text-sm text-rose-100">
            {checklist.blockingReasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Authority summary</p>
          <p className="mt-2 text-sm text-slate-400">
            {checklist.ownerType === "BROKER"
              ? `${checklist.brokerCompany ?? "Brokerage on file"}${checklist.brokerLicenseNumber ? ` · ${checklist.brokerLicenseNumber}` : ""}`
              : "Sell Hub Free seller path"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {checklist.brokerVerified ? "Broker verification passed." : checklist.ownerType === "BROKER" ? "Broker verification still required or pending." : "No broker verification required."}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Supporting evidence</p>
          <p className="mt-2 text-sm text-slate-400">
            {checklist.supportingSummary.total} files · {checklist.supportingSummary.approved} approved · {checklist.supportingSummary.pending} pending
          </p>
          {checklist.supportingSummary.rejected > 0 ? (
            <p className="mt-1 text-xs text-rose-300">{checklist.supportingSummary.rejected} supporting file(s) rejected.</p>
          ) : null}
        </div>
      </div>

      {checklist.riskAlerts.length > 0 ? (
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-300">Risk alerts</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-100">
            {checklist.riskAlerts.map((alert, index) => (
              <li key={`${alert.severity}-${index}`}>• {alert.severity}: {alert.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
