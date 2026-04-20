import Link from "next/link";

export type TrustGrowthPromptProps = {
  variant: "legal" | "broker" | "host";
  locale: string;
  country: string;
};

/**
 * Truthful trust/completion prompts — no hidden scores, rankings, or pressure tactics.
 */
export function TrustGrowthPrompt({ variant, locale, country }: TrustGrowthPromptProps) {
  const base = `/${locale}/${country}`;

  const copy =
    variant === "legal"
      ? {
          title: "Marketplace trust",
          body:
            "Completing verification and workflow steps helps buyers and renters recognize serious listings and hosts on the marketplace.",
          href: `${base}/legal`,
          cta: "Open Legal Hub",
        }
      : variant === "broker"
        ? {
            title: "Visibility readiness",
            body:
              "Finish your profile and required documents so matching and discovery can reflect accurate broker status.",
            href: `${base}/broker/complete-profile`,
            cta: "Complete profile",
          }
        : {
            title: "Listing & payouts readiness",
            body:
              "Stripe Connect onboarding and accurate listing details support guest confidence and smoother payouts.",
            href: `${base}/dashboard/host/payouts`,
            cta: "Payments & Stripe",
          };

  return (
    <aside
      className="rounded-2xl border border-premium-gold/25 bg-black/35 px-4 py-3 text-sm text-zinc-300 shadow-sm"
      aria-label={copy.title}
    >
      <p className="font-semibold text-premium-gold">{copy.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{copy.body}</p>
      <Link href={copy.href} className="mt-3 inline-flex text-xs font-medium text-premium-gold hover:underline">
        {copy.cta} →
      </Link>
    </aside>
  );
}
