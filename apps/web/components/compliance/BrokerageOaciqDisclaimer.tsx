import { getLocale } from "next-intl/server";

const DISCLAIMER_EN =
  "All brokerage activities are performed by a licensed real estate broker regulated by OACIQ.";

const DISCLAIMER_FR =
  "Toutes les activités de courtage sont exercées par un courtier immobilier titulaire de permis et soumis à l’OACIQ.";

/**
 * Legal disclaimer engine — show on broker-facing dashboards (alignment positioning; not a product-approval claim).
 */
export async function BrokerageOaciqDisclaimer() {
  const locale = await getLocale();
  const text = locale.startsWith("fr") ? DISCLAIMER_FR : DISCLAIMER_EN;

  return (
    <aside
      className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs leading-relaxed text-slate-400"
      role="note"
    >
      {text}
    </aside>
  );
}

export { DISCLAIMER_EN, DISCLAIMER_FR };
