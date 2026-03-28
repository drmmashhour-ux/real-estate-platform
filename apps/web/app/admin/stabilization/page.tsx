import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { StabilizationReport } from "@/src/modules/stabilization/types";

export const metadata = {
  title: "Stabilization report",
  robots: { index: false, follow: false },
};

function groupBySeverity(report: StabilizationReport) {
  const map = { CRITICAL: [] as string[], HIGH: [] as string[], MEDIUM: [] as string[], LOW: [] as string[] };
  for (const a of report.audits) {
    for (const i of a.issues) {
      map[i.severity].push(`[${a.name}] ${i.code}: ${i.message}${i.file ? ` — ${i.file}` : ""}`);
    }
  }
  return map;
}

export default function AdminStabilizationPage() {
  const path = join(process.cwd(), ".stabilization-report.json");
  if (!existsSync(path)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8 text-white">
        <h1 className="text-2xl font-semibold">Stabilization</h1>
        <p className="text-zinc-300">
          No report on disk. Run from the repo:{" "}
          <code className="rounded bg-zinc-800 px-2 py-1 text-sm">pnpm stabilize</code>
        </p>
        <p className="text-sm text-zinc-400">Output file: apps/web/.stabilization-report.json (gitignored)</p>
        <Link href="/admin" className="text-sky-400 underline">
          ← Admin home
        </Link>
      </div>
    );
  }

  let report: StabilizationReport;
  try {
    report = JSON.parse(readFileSync(path, "utf8")) as StabilizationReport;
  } catch {
    return (
      <div className="p-8 text-red-300">
        Failed to parse .stabilization-report.json. Run <code className="text-white">pnpm stabilize</code> again.
      </div>
    );
  }

  const grouped = groupBySeverity(report);
  const status = report.productionReady ? "Ready (no CRITICAL / no broken imports)" : "Not ready — see blockers";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Stabilization report</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            report.productionReady ? "bg-emerald-900/60 text-emerald-200" : "bg-red-900/60 text-red-200"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-zinc-400">
        Generated {report.generatedAt} · Critical count {report.criticalCount} · Issues by severity:{" "}
        {JSON.stringify(report.issuesBySeverity)}
      </p>

      {report.readinessBlockers && report.readinessBlockers.length > 0 && (
        <section className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
          <h2 className="mb-2 font-medium text-red-200">Blockers</h2>
          <ul className="list-inside list-disc text-sm text-red-100/90">
            {report.readinessBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) =>
        grouped[sev].length ? (
          <section key={sev} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <h2 className="mb-2 font-medium text-zinc-200">{sev}</h2>
            <ul className="max-h-64 list-inside list-disc overflow-y-auto text-sm text-zinc-300">
              {grouped[sev].slice(0, 80).map((line, idx) => (
                <li key={`${sev}-${idx}`}>{line}</li>
              ))}
            </ul>
            {grouped[sev].length > 80 && <p className="mt-2 text-xs text-zinc-500">+{grouped[sev].length - 80} more in JSON file</p>}
          </section>
        ) : null
      )}

      <div className="flex gap-4 text-sm">
        <Link href="/admin" className="text-sky-400 underline">
          ← Admin home
        </Link>
        <a href="/admin/issues" className="text-sky-400 underline">
          Issues hub
        </a>
      </div>
    </div>
  );
}
