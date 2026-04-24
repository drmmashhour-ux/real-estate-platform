import type { MarketingExpansionData } from "@/modules/command-center/command-center.types";

import { cc } from "@/components/command-center/cc-tokens";
import { Link } from "@/i18n/navigation";

export function MarketingExpansionPanel(props: { data: MarketingExpansionData }) {
  const { data } = props;
  return (
    <div className={`${cc.card} space-y-5`}>
      <div>
        <h3 className="text-sm font-semibold text-white">Today&apos;s publishing cadence</h3>
        <p className="mt-2 text-sm text-neutral-400">{data.scheduledHint}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={cc.cardMuted}>
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Campaigns</p>
          <p className="mt-2 text-sm text-neutral-300">{data.campaignHint}</p>
        </div>
        <div className={cc.cardMuted}>
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Expansion</p>
          <p className="mt-2 text-sm text-neutral-300">{data.expansionHint}</p>
        </div>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Territory opportunity</p>
        <p className="mt-2 text-sm text-neutral-200">{data.territoryOpportunity}</p>
      </div>
      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D4AF37]/90">Next recommended move</p>
        <p className="mt-2 text-sm text-neutral-100">{data.nextMove}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {data.links.map((l) => (
          <Link key={l.href} href={l.href} className={cc.linkSubtle}>
            {l.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
