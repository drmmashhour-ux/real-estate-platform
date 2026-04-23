import Link from "next/link";

const demoRecords = [
  {
    entity: "contract_123",
    retentionUntil: "2033-01-01",
    immutable: true,
    legalHold: false,
  },
  {
    entity: "complaint_456",
    retentionUntil: "2030-05-01",
    immutable: true,
    legalHold: true,
  },
];

export default function RetentionDashboard() {
  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Record retention &amp; legal hold</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Retention schedules, immutability, and holds block deletion or mutation until obligations are met. Demo rows
            below illustrate UI; live data will come from `compliance_record_retention` and APIs.
          </p>
        </div>
        <Link
          href="/dashboard/broker/compliance/audit"
          className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Audit trail
        </Link>
      </div>

      <section className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
        <p>
          <span className="font-medium text-white">APIs: </span>
          <code className="text-xs text-[#D4AF37]">POST /api/compliance/legal-hold</code> ·{" "}
          <code className="text-xs text-[#D4AF37]">POST /api/compliance/legal-hold/release</code>
        </p>
      </section>

      <div className="space-y-3">
        {demoRecords.map((r) => (
          <div key={r.entity} className="rounded-xl border border-[#D4AF37]/20 bg-black/50 p-4">
            <p className="font-medium text-white">{r.entity}</p>
            <p className="mt-2 text-sm text-white/65">Retention until: {r.retentionUntil}</p>
            <p className="text-sm text-white/65">Immutable: {r.immutable ? "Yes" : "No"}</p>
            <p className="text-sm text-white/65">Legal hold: {r.legalHold ? "Active" : "None"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
