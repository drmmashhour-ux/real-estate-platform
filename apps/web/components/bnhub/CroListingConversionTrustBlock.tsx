import { Check } from "lucide-react";
import { buildBnhubStayTrustPack } from "@/modules/cro/trust-signals.service";

/** Spec-aligned trust bullets: verified (when true), Stripe, platform — never invented. */
export function CroListingConversionTrustBlock({
  listingVerified,
  stripeCheckoutAvailable,
}: {
  listingVerified: boolean;
  stripeCheckoutAvailable: boolean;
}) {
  const pack = buildBnhubStayTrustPack({ listingVerified, stripeCheckoutAvailable });
  const visible = pack.bullets.filter((b) => b.visible);
  if (visible.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white px-4 py-3 ring-1 ring-emerald-100/80">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80">{pack.headline}</p>
      <ul className="mt-2 space-y-2 text-sm font-medium text-emerald-950">
        {visible.map((b) => (
          <li key={b.id} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
