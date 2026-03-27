import type { CommandListingRow } from "@/lib/dashboard/command-center-data";

export function PremiumActivityFeed({ listings }: { listings: CommandListingRow[] }) {
  const events = listings
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      title: l.title,
      at: l.updatedAt,
      line:
        l.dealScore != null
          ? `Deal analysis available · score ${l.dealScore}`
          : "Listing updated — run analysis for insights",
    }));

  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No recent activity.</p>;
  }

  return (
    <ol className="space-y-3 text-sm">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 border-b border-white/5 pb-3 last:border-0">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#C9A646]/80" />
          <div>
            <p className="font-medium text-slate-200">{e.title}</p>
            <p className="text-xs text-slate-500">{e.line}</p>
            <time className="text-[10px] text-slate-600" dateTime={e.at}>
              {new Date(e.at).toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
