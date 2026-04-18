"use client";

import type { MorningBriefModeView as MorningBriefData } from "../../company-command-center-v5.types";
import { DeltaHighlights } from "../shared/DeltaHighlights";
import { ModeHeroSummary } from "../shared/ModeHeroSummary";
import { ModePriorityList } from "../shared/ModePriorityList";
import { ModeRiskList } from "../shared/ModeRiskList";
import { ModeSystemCard } from "../shared/ModeSystemCard";
import Link from "next/link";

export function MorningBriefModeView({
  view,
  quickKpis,
}: {
  view: MorningBriefData;
  quickKpis: { label: string; value: string; href: string | null }[];
}) {
  return (
    <div className="space-y-6">
      <ModeHeroSummary text={view.heroSummary} />
      <div className="grid gap-6 md:grid-cols-2">
        <ModePriorityList title="Top opportunities" items={view.topOpportunities} />
        <ModeRiskList title="Top risks" items={view.topRisks} />
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">What changed (prior window)</h4>
        <div className="mt-2">
          <DeltaHighlights lines={view.topChanges} />
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Today focus</h4>
        <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
          {(view.todayFocus.length ? view.todayFocus : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Quick KPIs</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickKpis.slice(0, 8).map((k) => (
            <div key={k.label} className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[11px]">
              <span className="text-zinc-500">{k.label}</span>
              <p className="text-zinc-200">
                {k.href ? (
                  <Link href={k.href} className="text-amber-300/90 hover:text-amber-200">
                    {k.value}
                  </Link>
                ) : (
                  k.value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Systems needing attention</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.keySystems.length
            ? view.keySystems.map((s) => <ModeSystemCard key={s.id} label={s.label} status={s.status} note={s.note} />)
            : (
                <p className="text-xs text-zinc-500">None flagged in snapshot.</p>
              )}
        </div>
      </div>
      {view.warnings.length > 0 ? (
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Warnings</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {view.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
