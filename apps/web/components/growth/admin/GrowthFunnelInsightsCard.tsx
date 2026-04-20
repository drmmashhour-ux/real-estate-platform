import type { GrowthFunnelSummary } from "@/modules/growth-intelligence/growth.types";

export function GrowthFunnelInsightsCard(props: { funnel: GrowthFunnelSummary }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-zinc-300">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-premium-gold">Funnel diagnostics</p>
      <ul className="mt-3 space-y-2">
        {props.funnel.worstListings.slice(0, 6).map((w) => (
          <li key={w.listingId} className="font-mono text-[11px] text-zinc-400">
            {w.listingId.slice(0, 12)}… ratio {w.ratio.toFixed(4)} · views {w.views} · contacts {w.contacts}
          </li>
        ))}
      </ul>
      <ul className="mt-3 list-inside list-disc text-zinc-500">
        {props.funnel.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
