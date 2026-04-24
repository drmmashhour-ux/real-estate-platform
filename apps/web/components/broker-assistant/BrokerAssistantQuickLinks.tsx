"use client";

import Link from "next/link";

function assistHref(crmDealId: string | undefined, intent: string): string {
  const p = new URLSearchParams();
  if (crmDealId) p.set("crmDealId", crmDealId);
  p.set("intent", intent);
  return `/dashboard/broker-assistant?${p.toString()}`;
}

/**
 * Deep links into `/dashboard/broker-assistant` with optional CRM `Deal` id. No automatic actions.
 */
export function BrokerAssistantQuickLinks(props: { crmDealId: string; className?: string }) {
  const { crmDealId, className = "" } = props;
  const linkCls =
    "inline-flex items-center rounded-lg border border-[#D4AF37]/35 bg-black/40 px-3 py-2 text-xs font-medium text-[#D4AF37] hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/10";

  return (
    <section className={`rounded-2xl border border-ds-border bg-ds-card/60 p-4 shadow-ds-soft ${className}`}>
      <h3 className="font-medium text-ds-text">AI Broker Assistant (Québec résidentiel)</h3>
      <p className="mt-1 text-xs text-ds-text-secondary">
        Suggestions seulement — révision courtier obligatoire. Aucun envoi automatique.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={assistHref(crmDealId, "ask")} className={linkCls}>
          Ask AI Broker Assistant
        </Link>
        <Link href={assistHref(crmDealId, "check")} className={linkCls}>
          Check file completeness
        </Link>
        <Link href={assistHref(crmDealId, "compliance")} className={linkCls}>
          Review compliance
        </Link>
        <Link href={assistHref(crmDealId, "translate")} className={linkCls}>
          Draft message in French
        </Link>
        <Link href={assistHref(crmDealId, "clauses")} className={linkCls}>
          Suggest clause set
        </Link>
      </div>
    </section>
  );
}
