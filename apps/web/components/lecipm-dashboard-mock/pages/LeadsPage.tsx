import { MockBadge } from "@/components/lecipm-dashboard-mock/mock-ui";

const ROWS = [
  { name: "Amélie Rousseau", source: "CENTRIS" as const, status: "New" },
  { name: "Marc Chen", source: "LECIPM" as const, status: "Qualified" },
  { name: "Sara El-Amin", source: "CENTRIS" as const, status: "Contacted" },
  { name: "JP Ouellette", source: "LECIPM" as const, status: "Booked showing" },
  { name: "Nadia Fortin", source: "CENTRIS" as const, status: "Nurture" },
];

export function LeadsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Leads</h1>
        <p className="mt-1 text-sm text-ds-text-secondary">Attribution across syndication and owned funnels</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-ds-border bg-ds-card shadow-ds-soft">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ds-border bg-black/60 text-[11px] font-semibold uppercase tracking-[0.15em] text-ds-text-secondary">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr
                key={r.name}
                className="border-b border-ds-border/80 transition-colors duration-200 last:border-0 hover:bg-ds-gold/[0.06]"
              >
                <td className="px-4 py-3.5 font-medium text-white">{r.name}</td>
                <td className="px-4 py-3.5">
                  <SourcePill source={r.source} />
                </td>
                <td className="px-4 py-3.5 text-ds-text-secondary">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourcePill({ source }: { source: "CENTRIS" | "LECIPM" }) {
  if (source === "CENTRIS") {
    return <MockBadge tone="muted">{source}</MockBadge>;
  }
  return <MockBadge tone="gold">{source}</MockBadge>;
}
