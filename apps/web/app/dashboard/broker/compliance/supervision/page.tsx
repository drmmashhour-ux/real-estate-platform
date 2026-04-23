import Link from "next/link";

const demoAssignments = [
  {
    id: "sup_1",
    supervised: "Assistant A",
    supervisor: "Broker Marie",
    type: "assistant_support",
    status: "active",
  },
  {
    id: "sup_2",
    supervised: "Employee B",
    supervisor: "Agency Admin Paul",
    type: "listing_review",
    status: "active",
  },
];

export default function SupervisionDashboardPage() {
  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Authorization &amp; supervision</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Track delegated authority, supervision assignments, and accountability chains. Production data will load from
            compliance APIs; this page shows layout and navigation only until those endpoints are wired.
          </p>
        </div>
        <Link
          href="/dashboard/broker/compliance/audit"
          className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Audit trail
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Supervision</h2>
          <p className="mt-1 text-xs text-white/50">Active supervisor ↔ supervised relationships for this book.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Delegation</h2>
          <p className="mt-1 text-xs text-white/50">Scoped, revocable authority keys (prepare vs final regulated acts).</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Accountability chain</h2>
          <p className="mt-1 text-xs text-white/50">Who acted, who supervised, who is legally accountable.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Approval tasks</h2>
          <p className="mt-1 text-xs text-white/50">Delegated preparatory work pending licensee or executive approval.</p>
        </div>
      </section>

      <div className="space-y-3">
        {demoAssignments.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#D4AF37]/20 bg-black/50 p-4">
            <div className="font-semibold">
              {item.supervised} → {item.supervisor}
            </div>
            <div className="mt-2 text-sm text-white/55">
              {item.type} · {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
