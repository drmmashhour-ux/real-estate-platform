import type { LecipmTrustOperationalBand } from "@/types/trust-enums-client";

import { TrustBandBadge } from "./TrustBandBadge";

export function TrustScoreCard(props: {
  score: number;
  band: LecipmTrustOperationalBand;
  deltaFromPrior: number | null;
  subtitle?: string;
}) {
  const delta = props.deltaFromPrior;
  const deltaLabel =
    delta == null ? "No prior snapshot" : delta === 0 ? "Flat vs prior run" : `${delta > 0 ? "+" : ""}${delta} vs prior`;

  return (
    <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-black via-zinc-950 to-black p-5 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Operational trust</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="font-serif text-5xl font-bold text-[#f4efe4]">{props.score}</span>
            <TrustBandBadge band={props.band} />
          </div>
          <p className="mt-2 text-xs text-zinc-400">{deltaLabel}</p>
          {props.subtitle ?
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-zinc-500">{props.subtitle}</p>
          : null}
        </div>
      </div>
    </div>
  );
}
