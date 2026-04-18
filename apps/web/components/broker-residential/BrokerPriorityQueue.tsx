import Link from "next/link";
import type { ResidentialPriorityItem } from "@/modules/broker-residential-copilot/broker-residential-copilot.types";

export function BrokerPriorityQueue({ items, basePath }: { items: ResidentialPriorityItem[]; basePath: string }) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card/70 p-5 shadow-ds-soft">
      <h2 className="font-serif text-lg text-ds-text">Priority queue</h2>
      <p className="mt-1 text-xs text-ds-text-secondary">Top items needing attention — assistance only, not legal determinations.</p>
      <ul className="mt-4 space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-ds-text-secondary">No queued items. Great time to clear follow-ups.</li>
        ) : (
          items.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/5 bg-black/30 px-3 py-2"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase text-ds-gold/80">{p.kind.replace(/_/g, " ")}</span>
                <p className="font-medium text-ds-text">{p.title}</p>
                <p className="text-sm text-ds-text-secondary">{p.summary}</p>
              </div>
              {p.href ? (
                <Link href={p.href.startsWith("http") ? p.href : p.href} className="shrink-0 text-sm text-ds-gold hover:text-amber-200">
                  Open →
                </Link>
              ) : p.dealId ? (
                <Link href={`${basePath}/deals/${p.dealId}`} className="text-sm text-ds-gold hover:text-amber-200">
                  Deal →
                </Link>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
