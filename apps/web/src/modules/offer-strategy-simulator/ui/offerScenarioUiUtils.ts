import { ImpactBand } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";

export function impactBandClasses(band: ImpactBand): { ring: string; text: string; bg: string } {
  switch (band) {
    case ImpactBand.Favorable:
      return { ring: "ring-emerald-500/40", text: "text-emerald-300", bg: "bg-emerald-950/40" };
    case ImpactBand.Neutral:
      return { ring: "ring-slate-500/40", text: "text-slate-200", bg: "bg-slate-900/50" };
    case ImpactBand.Caution:
      return { ring: "ring-amber-500/50", text: "text-amber-200", bg: "bg-amber-950/35" };
    case ImpactBand.Elevated:
      return { ring: "ring-red-500/50", text: "text-red-200", bg: "bg-red-950/40" };
    default:
      return { ring: "ring-slate-500/40", text: "text-slate-200", bg: "bg-slate-900/50" };
  }
}
