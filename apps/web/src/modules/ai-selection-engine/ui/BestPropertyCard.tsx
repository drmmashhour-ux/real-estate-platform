import Link from "next/link";
import type { PropertySelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";

export function BestPropertyCard({ selection }: { selection: PropertySelectionResult }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-premium-gold">{selection.category.replace(/_/g, " ")}</p>
      <p className="mt-1 text-sm text-white">{selection.city}</p>
      <p className="mt-1 text-xs text-slate-300">Score {selection.score} · Confidence {selection.confidence}%</p>
      <p className="mt-2 text-xs text-slate-400">{selection.reasons[0]}</p>
      <Link href={`/analysis/${selection.city.toLowerCase().replace(/\s+/g, "-")}/${selection.listingId}`} className="mt-3 inline-flex text-xs text-premium-gold hover:underline">
        Open analysis
      </Link>
    </div>
  );
}
