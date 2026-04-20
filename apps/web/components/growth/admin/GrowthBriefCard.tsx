import type { GrowthContentBrief } from "@/modules/growth-intelligence/growth-content-brief.service";

export function GrowthBriefCard(props: { title: string; brief: GrowthContentBrief }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-4 text-xs text-zinc-300">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-premium-gold">{props.title}</p>
      <p className="mt-2 text-sm text-white">{props.brief.title}</p>
      <p className="mt-2 text-zinc-400">{props.brief.purpose}</p>
      <ul className="mt-3 list-inside list-disc text-zinc-500">
        {props.brief.keySections.slice(0, 6).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-500">{props.brief.whyGeneratedNow}</p>
      <ul className="mt-2 list-inside list-disc text-[10px] text-zinc-600">
        {props.brief.timelineEvidenceSummary.slice(0, 4).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">{props.brief.disclaimers.join(" · ")}</p>
    </div>
  );
}
