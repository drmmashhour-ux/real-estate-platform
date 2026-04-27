"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { trackClientAnalyticsEvent } from "@/lib/client-analytics";
import { f1ViewTierAndPrices } from "@/config/syria-f1-pricing.config";
import { f1AmountForPlan, type F1PlanKey } from "@/lib/payment-f1";
import { SYRIA_PRICING } from "@/lib/pricing";
import { formatSyriaCurrency } from "@/lib/format";

type Contact = { displayPhone: string; whatsappHref: string | null; telHref: string | null } | null;
type Plan = F1PlanKey;

function formatR1PriceLine(amount: number, locale: string): string {
  if (locale.startsWith("ar")) {
    return `${amount.toLocaleString("ar-SY", { maximumFractionDigits: 0 })} ل.س`;
  }
  return formatSyriaCurrency(amount, SYRIA_PRICING.currency, locale);
}

export function MakeFeaturedCta({
  listingId,
  contact,
  featuredDurationDays,
  currentPlan,
  viewCount = 0,
  isDirect = false,
}: {
  listingId: string;
  contact: Contact;
  featuredDurationDays: number;
  currentPlan: "free" | "featured" | "premium";
  /** Stored public views (triggers R1 nudge at >= 10). */
  viewCount?: number;
  isDirect?: boolean;
}) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const isAr = locale.startsWith("ar");
  const canPickFeatured = currentPlan === "free";
  const [plan, setPlan] = useState<Plan>(canPickFeatured ? "featured" : "premium");
  const [err, setErr] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);

  const lineFeatured = formatR1PriceLine(f1AmountForPlan("featured", viewCount), locale);
  const linePremium = formatR1PriceLine(f1AmountForPlan("premium", viewCount), locale);
  const priceForSelectedPlan = plan === "featured" ? lineFeatured : linePremium;
  const { showLadderHint } = f1ViewTierAndPrices(viewCount);

  const showViewsNudge = currentPlan === "free" && viewCount >= 10;
  const showDirectNudge = currentPlan === "free" && isDirect && !showViewsNudge;
  const benefits = [t("makeFeaturedM1Benefit1"), t("makeFeaturedM1Benefit2"), t("makeFeaturedM1Benefit3")];

  async function onWhatsappPayClick() {
    if (!contact) return;
    setErr(null);
    setWaLoading(true);
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId, plan }),
      });
      const data = (await res.json()) as { ok?: boolean; whatsappUrl?: string; error?: string };
      if (!res.ok || !data.ok || typeof data.whatsappUrl !== "string") {
        setErr(t("makeFeaturedError"));
        return;
      }
      trackClientAnalyticsEvent("f1_payment_request", { propertyId: listingId, payload: { plan, listingId } });
      trackClientAnalyticsEvent("whatsapp_clicked", { propertyId: listingId, payload: { listingId, plan } });
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      setErr(t("makeFeaturedError"));
    } finally {
      setWaLoading(false);
    }
  }

  return (
    <Card
      className="scroll-mt-24 border-amber-200/80 bg-gradient-to-b from-amber-50/95 to-[color:var(--darlink-surface)] p-4 shadow-[var(--darlink-shadow-sm)] sm:p-5"
    >
      {showViewsNudge ? (
        <p className="text-sm font-bold leading-snug text-amber-950">{t("revNudgeViews")}</p>
      ) : showDirectNudge ? (
        <p className="text-sm font-bold leading-snug text-amber-950">{t("revNudgeDirectFree")}</p>
      ) : (
        <h2 className="text-base font-bold leading-snug text-amber-950 sm:text-lg">{t("makeFeaturedM1Headline")}</h2>
      )}

      <ul className="mt-2.5 list-none space-y-1" dir={isAr ? "rtl" : "ltr"}>
        {benefits.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-[color:var(--darlink-text)]">
            <span className="shrink-0 text-emerald-600" aria-hidden>
              ✔
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {canPickFeatured ? (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-gold)]">{t("bakaPickPlan")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlan("featured")}
              className={`w-full min-h-14 rounded-[var(--darlink-radius-lg)] border-2 p-3 text-start ${
                plan === "featured"
                  ? "border-[#D4AF37] bg-amber-50/90 ring-1 ring-amber-300/50"
                  : "border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]"
              }`}
            >
              <p className="text-sm font-bold text-[color:var(--darlink-text)]">{t("bakaPlanFeatured")}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-900">{lineFeatured}</p>
            </button>
            <button
              type="button"
              onClick={() => setPlan("premium")}
              className={`w-full min-h-14 rounded-[var(--darlink-radius-lg)] border-2 p-3 text-start ${
                plan === "premium"
                  ? "border-[color:var(--darlink-sand)] bg-amber-50/90 ring-1 ring-amber-200/50"
                  : "border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]"
              }`}
            >
              <p className="text-sm font-bold text-[color:var(--darlink-text)]">{t("bakaPlanPremium")}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-900">{linePremium}</p>
              <p className="mt-1.5 text-[11px] font-medium leading-snug text-amber-950/90">{t("f1PremiumBundleLine")}</p>
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-sm font-bold text-amber-950" dir={isAr ? "rtl" : "ltr"}>
        {t("makeFeaturedM1PriceLine", { amount: priceForSelectedPlan })}
      </p>
      {showLadderHint ? (
        <p className="mt-1 text-sm font-semibold text-amber-900" dir={isAr ? "rtl" : "ltr"}>
          {t("f1PriceLadderHint")}
        </p>
      ) : null}
      <p className="mt-1.5 text-xs text-[color:var(--darlink-text-muted)]" dir={isAr ? "rtl" : "ltr"}>
        {t("r1DurationNote", { days: featuredDurationDays })}
      </p>

      <p
        className="mt-3 text-center text-sm font-bold text-amber-900"
        dir={isAr ? "rtl" : "ltr"}
      >
        {t("makeFeaturedM1Urgency7d")}
      </p>

      {contact ? (
        <>
          <Button
            type="button"
            disabled={waLoading}
            variant="primary"
            className="mt-2 w-full min-h-12 text-base"
            onClick={() => void onWhatsappPayClick()}
          >
            {waLoading ? "…" : t("makeFeaturedCta")}
          </Button>
        </>
      ) : null}

      {contact?.telHref ? (
        <a
          href={contact.telHref}
          className="mt-2 flex min-h-11 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border-2 border-[color:var(--darlink-navy)] bg-[color:var(--darlink-surface)] px-4 text-sm font-semibold text-[color:var(--darlink-navy)]"
        >
          {t("makeFeaturedCall", { phone: contact.displayPhone })}
        </a>
      ) : null}

      {!contact ? <p className="mt-3 text-center text-xs text-amber-900/80">{t("makeFeaturedNoAdminPhone")}</p> : null}
      {err ? <p className="mt-2 text-sm text-amber-900">{err}</p> : null}
      {canPickFeatured && contact ? (
        <p className="mt-1 text-center text-xs text-[color:var(--darlink-text-muted)]" dir="ltr">
          {t("bakaTeaserPrice", { amount: priceForSelectedPlan, days: featuredDurationDays })}
        </p>
      ) : null}
    </Card>
  );
}
