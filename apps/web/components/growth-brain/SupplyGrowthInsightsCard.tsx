import Link from "next/link";

type Props = {
  city?: string | null;
  demandHint?: "higher" | "typical" | "lower" | "unknown";
  photoGap?: boolean;
};

/**
 * Supply-side hints for host/seller dashboards — no fabricated stats.
 */
export function SupplyGrowthInsightsCard({ city, demandHint = "unknown", photoGap }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <p className="font-semibold text-slate-900">Growth insights</p>
      {city ? (
        <p className="mt-2">
          Demand signals for <span className="font-medium">{city}</span> are{" "}
          {demandHint === "higher"
            ? "trending up in our sampled segments — keep your listing accurate."
            : demandHint === "lower"
              ? "quiet in sampled data — consider photos and details before changing price."
              : "mixed — focus on clarity and trust signals."}
        </p>
      ) : (
        <p className="mt-2 text-slate-600">Add city to see localized demand hints.</p>
      )}
      {photoGap ? (
        <p className="mt-2 text-amber-800">
          Listings with more photos tend to earn more engagement — add images you have rights to use.
        </p>
      ) : null}
      <Link href="/help" className="mt-3 inline-block text-sm font-medium text-amber-800 hover:underline">
        Listing quality tips
      </Link>
    </div>
  );
}
