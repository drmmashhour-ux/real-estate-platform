import Link from "next/link";
import type { DreamHomeMatchedListing } from "@/modules/dream-home/types/dream-home.types";

type Props = { listing: DreamHomeMatchedListing; basePath: string; rank?: number };

function priceFmt(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function DreamHomeListingCard({ listing: L, basePath, rank }: Props) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-44">
        {L.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={L.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-xs text-slate-500">No image</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">
          {rank != null ? `#${rank} · ` : null}
          Match {L.matchScore.toFixed(2)} · {L.city}
          {L.propertyType ? ` · ${L.propertyType}` : ""}
        </p>
        <h3 className="mt-1 font-semibold text-white">{L.title}</h3>
        <p className="mt-1 text-sm text-premium-gold">
          {priceFmt(L.priceCents)} · {L.bedrooms ?? "—"} bd · {L.bathrooms ?? "—"} ba
        </p>
        {L.scoreBreakdown ? (
          <p className="mt-1 text-xs text-slate-500">
            Score blend: filter fit {L.scoreBreakdown.filterFit.toFixed(2)} · lifestyle fit{" "}
            {L.scoreBreakdown.lifestyleFit.toFixed(2)} (rule-based, from your answers + listing text)
          </p>
        ) : null}
        <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
          {L.whyThisFits.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <Link
          href={`${basePath}/listings/${L.id}`}
          className="mt-3 inline-block text-sm font-medium text-premium-gold hover:underline"
        >
          View listing
        </Link>
      </div>
    </li>
  );
}
