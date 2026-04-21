import { MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

const EVENTS = [
  { type: "warning" as const, msg: "Listing #8821 — photo set includes unverified watermark (auto-flagged)." },
  { type: "warning" as const, msg: "Lead export to external CRM blocked — consent record expired." },
  { type: "violation" as const, msg: "None open · last critical review 12d ago." },
];

export function CompliancePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Compliance</h1>
        <p className="mt-1 text-sm text-ds-text-secondary">Posture · risk · event stream (mock)</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <MockCard className="hover:border-ds-gold/35 hover:shadow-[0_0_32px_rgba(212,175,55,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">Compliance Score</p>
          <p className="mt-3 text-4xl font-bold text-ds-gold">91</p>
          <p className="mt-2 text-xs text-ds-text-secondary">Aggregated from disclosures, consents, and workflow checkpoints.</p>
        </MockCard>
        <MockCard className="hover:border-ds-gold/35 hover:shadow-[0_0_32px_rgba(212,175,55,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">Risk Level</p>
          <p className="mt-3 text-4xl font-bold text-emerald-300/90">Low</p>
          <p className="mt-2 text-xs text-ds-text-secondary">No material open items requiring immediate broker action.</p>
        </MockCard>
      </div>

      <MockCard>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Events</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Warnings &amp; violations</h2>
        <ul className="mt-5 space-y-3">
          {EVENTS.map((e) => (
            <li
              key={e.msg}
              className={`rounded-lg border px-4 py-3 text-sm transition hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] ${
                e.type === "violation"
                  ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-100/90"
                  : "border-amber-500/25 bg-amber-500/5 text-amber-50/95"
              }`}
            >
              <span className="mr-2 font-semibold uppercase tracking-wide text-[10px] text-ds-text-secondary">
                [{e.type}]
              </span>
              {e.msg}
            </li>
          ))}
        </ul>
      </MockCard>
    </div>
  );
}
