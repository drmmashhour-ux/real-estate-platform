import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_OPERATOR } from "@/lib/brand/platform";

export const metadata = {
  title: "Trust & reputation",
  description: `How ${PLATFORM_CARREFOUR_NAME} scores listings and hosts, transparency, and compliance.`,
};

/**
 * Public transparency page for the reputation layer (Order 48).
 * Numeric scores are not shown here; we explain categories and process only.
 */
export default function TrustPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">Trust &amp; reputation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {PLATFORM_OPERATOR} — {PLATFORM_CARREFOUR_NAME}
      </p>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium">How scoring works</h2>
        <p>
          We combine operational signals (for example completed stays, how complete a listing is, and stability of
          pricing) to help rank results and surface trustworthy hosts. Levels such as &quot;Trusted listing&quot; or
          &quot;Top host&quot; reflect these signals in broad categories — not a single number shown to the public.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium">Transparency</h2>
        <p>
          We avoid irreversible negative labels. New listings are not treated as &quot;bad by default&quot;; scores can
          improve as real activity and content quality accrue. We may refine weights over time and will keep this page
          aligned with product behavior.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium">Compliance (OACIQ &amp; fraud resistance)</h2>
        <p>
          This layer supports safer discovery and is designed to work alongside professional and regulatory
          requirements in Québec (including OACIQ where applicable) and our fraud-prevention efforts. It does not
          replace licensing, brokerage rules, or identity verification.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}
