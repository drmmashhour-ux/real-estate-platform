import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { buildMarketplaceSnapshot } from "@/modules/autonomy/darlink-marketplace-snapshot.service";
import { buildMarketplaceSignals } from "@/modules/autonomy/darlink-signal-builder.service";

/** Host-facing hints — recommendation-only wording; never mutates state. */

type Props = {
  listingIds: string[];
};

export async function DarlinkSellerAutopilotHints(props: Props) {
  const flags = getDarlinkAutonomyFlags();
  if (!flags.AUTONOMY_ENABLED || props.listingIds.length === 0) return null;

  try {
    const snapshot = await buildMarketplaceSnapshot({ listingId: props.listingIds[0] });
    const signals = buildMarketplaceSignals(snapshot).slice(0, 8);
    if (signals.length === 0) return null;

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-sm text-amber-950">
        <p className="font-semibold text-amber-950">Operator hints (non-binding)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90">
          {signals.map((s) => (
            <li key={s.id}>{s.explanation}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-amber-900/70">
          Darlink does not auto-change pricing, payouts, or visibility from this panel.
        </p>
      </div>
    );
  } catch {
    return null;
  }
}
