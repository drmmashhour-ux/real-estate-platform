import type { LaunchChecklistPayload } from "@/modules/launch/launch-checklist.service";

export function LaunchChecklistPanel({ data }: { data: LaunchChecklistPayload }) {
  return (
    <section className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-6">
      <h2 className="text-lg font-semibold text-emerald-100">Launch readiness</h2>
      <p className="mt-1 text-xs text-emerald-200/70">
        Status:{" "}
        <span className={data.status === "ready" ? "text-emerald-300" : "text-amber-300"}>{data.status}</span> · No
        fabricated checks — booking E2E and browser QA remain manual.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-zinc-300">
        <li>API health (process): {data.checklist.apiHealth ? "ok" : "—"}</li>
        <li>Readiness (db + i18n + market): {data.checklist.apiReady ? "ok" : "fail"}</li>
        <li>Stripe secret: {data.checklist.stripeSecret ? "set" : "missing"}</li>
        <li>Stripe webhook secret: {data.checklist.stripeWebhookSecret ? "set" : "missing"}</li>
        <li>
          Migrations counted: {data.checklist.migrationCount ?? "unknown"}{" "}
          {data.checklist.databaseMigrationsCounted ? "" : "(could not read _prisma_migrations)"}
        </li>
        <li>DB latency (ms): {data.health.dbLatencyMs ?? "n/a"}</li>
      </ul>
      {data.issues.length > 0 ? (
        <ul className="mt-4 list-inside list-disc text-sm text-amber-200/90">
          {data.issues.map((i) => (
            <li key={i.code}>
              [{i.severity}] {i.message}
            </li>
          ))}
        </ul>
      ) : null}
      {data.recommendations.length > 0 ? (
        <div className="mt-4 text-xs text-zinc-500">
          <p className="font-medium text-zinc-400">Recommendations</p>
          <ul className="mt-1 list-inside list-disc">
            {data.recommendations.map((r) => (
              <li key={r.slice(0, 40)}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-4 text-[11px] text-zinc-600">Generated {data.generatedAt}</p>
    </section>
  );
}
