import Link from "next/link";
import type { HostAiPanelPayload } from "@/modules/host-ai/panel.service";

const GOLD = "#D4AF37";

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function HostAiCopilotSection({ panel }: { panel: HostAiPanelPayload }) {
  const { listing, optimization, insights, pricing } = panel;

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-[#111] p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">AI suggestions</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Guidance only — review, edit, and apply changes yourself. No automatic risky actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/host/pricing" className="font-medium hover:underline" style={{ color: GOLD }}>
            Pricing hub →
          </Link>
          <Link href="/host/listings" className="font-medium text-zinc-400 hover:text-zinc-200">
            Listings →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-black/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Host insights</h3>
          <ul className="space-y-3 text-sm text-zinc-300">
            {insights.occupancyTrends.map((x, i) => (
              <li key={`o-${i}`}>
                <span className="font-medium text-white">{x.title}</span>
                <p className="mt-0.5 text-xs text-zinc-400">{x.detail}</p>
              </li>
            ))}
            {insights.revenueOpportunities.slice(0, 2).map((x, i) => (
              <li key={`r-${i}`}>
                <span className="font-medium" style={{ color: GOLD }}>
                  {x.title}
                </span>
                <p className="mt-0.5 text-xs text-zinc-400">{x.detail}</p>
              </li>
            ))}
            {insights.weakPoints.slice(0, 2).map((x, i) => (
              <li key={`w-${i}`}>
                <span className="font-medium text-amber-200/90">{x.title}</span>
                <p className="mt-0.5 text-xs text-zinc-400">{x.detail}</p>
              </li>
            ))}
          </ul>
          {insights.reasoning[0] ? <p className="text-[10px] text-zinc-600">{insights.reasoning[0]}</p> : null}
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-black/30 p-4 lg:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Listing improvements</h3>
          {!listing || !optimization ? (
            <p className="text-sm text-zinc-500">Publish a listing to see title, description, amenity, and photo tips.</p>
          ) : (
            <>
              <p className="text-xs text-zinc-500">{listing.title.slice(0, 48)}</p>
              {optimization.suggestedTitle ? (
                <div className="text-sm">
                  <p className="text-[11px] font-medium uppercase text-zinc-500">Suggested title</p>
                  <p className="text-zinc-200">{optimization.suggestedTitle}</p>
                </div>
              ) : null}
              {optimization.missingAmenities.length > 0 ? (
                <div className="text-sm">
                  <p className="text-[11px] font-medium uppercase text-zinc-500">Consider adding</p>
                  <p className="text-xs text-zinc-400">{optimization.missingAmenities.join(", ")}</p>
                </div>
              ) : null}
              {optimization.photoImprovements.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
                  {optimization.photoImprovements.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {optimization.suggestedDescription ? (
                <details className="text-xs text-zinc-400">
                  <summary className="cursor-pointer text-zinc-300">Description template</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-2 text-[11px]">
                    {optimization.suggestedDescription}
                  </pre>
                </details>
              ) : null}
              <Link
                href={`/bnhub/host/listings/${listing.id}/edit`}
                className="inline-block text-xs font-medium hover:underline"
                style={{ color: GOLD }}
              >
                Edit listing →
              </Link>
            </>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-black/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pricing suggestion</h3>
          {!pricing ? (
            <p className="text-sm text-zinc-500">Set a base nightly rate on a published listing to see a suggested price.</p>
          ) : (
            <>
              <p className="text-sm text-white">
                <span className="font-medium">Suggested price:</span> {money(pricing.suggestedPriceCents, pricing.currency)}
              </p>
              <p className="text-xs text-zinc-500">
                Current base: {money(pricing.currentPriceCents, pricing.currency)}
              </p>
              <p className="text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Reason:</span>{" "}
                {pricing.reasoning.find((l) => !l.startsWith("Current base nightly rate")) ?? pricing.reasoning[1] ?? "See full hub for details."}
              </p>
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer text-zinc-400">Full reasoning</summary>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {pricing.reasoning.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </details>
              <Link
                href="/host/pricing"
                className="inline-block text-xs font-medium hover:underline"
                style={{ color: GOLD }}
              >
                Open pricing tools →
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
