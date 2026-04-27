"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatSyriaCurrency } from "@/lib/format";
import { trackClientAnalyticsEvent } from "@/lib/client-analytics";
import { f1AmountForPlan, type F1PlanKey } from "@/lib/payment-f1";
import { SYRIA_PRICING } from "@/lib/pricing";

type Contact = { displayPhone: string; whatsappHref: string | null; telHref: string | null } | null;

type Plan = F1PlanKey;

export function MakeFeaturedCta({
  listingId,
  contact,
  featuredDurationDays,
  currentPlan,
}: {
  listingId: string;
  contact: Contact;
  /** Shown in price copy (e.g. / 30 days) */
  featuredDurationDays: number;
  /** F1: free → featured/premium; featured → premium only. */
  currentPlan: "free" | "featured" | "premium";
}) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const isAr = locale.startsWith("ar");
  const canPickFeatured = currentPlan === "free";
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>(canPickFeatured ? "featured" : "premium");
  const [err, setErr] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const lineFeatured = formatSyriaCurrency(f1AmountForPlan("featured"), SYRIA_PRICING.currency, locale);
  const linePremium = formatSyriaCurrency(f1AmountForPlan("premium"), SYRIA_PRICING.currency, locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const valueLines = [t("bakaValue1"), t("bakaValue2"), t("bakaValue3")];
  const priceForSelectedPlan = plan === "featured" ? lineFeatured : linePremium;

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
      trackClientAnalyticsEvent("whatsapp_clicked", {
        propertyId: listingId,
        payload: { listingId, plan },
      });
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      setErr(t("makeFeaturedError"));
    } finally {
      setWaLoading(false);
    }
  }

  function onOpenModal() {
    setErr(null);
    setModalOpen(true);
    setPlan(canPickFeatured ? "featured" : "premium");
    trackClientAnalyticsEvent("upgrade_opened", { propertyId: listingId, payload: { listingId } });
  }

  const modal = modalOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="baka-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            tabIndex={-1}
            aria-label={t("bakaClose")}
            onClick={() => setModalOpen(false)}
          />
          <div
            className="relative z-10 flex max-h-[min(92vh,800px)] w-full max-w-lg flex-col rounded-t-[1.25rem] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-[var(--darlink-shadow-sm)] sm:max-h-[min(88vh,760px)] sm:rounded-[var(--darlink-radius-2xl)]"
            dir={isAr ? "rtl" : "ltr"}
          >
            <div className="flex max-h-full min-h-0 flex-1 flex-col">
              <div className="relative shrink-0 border-b border-[color:var(--darlink-border)] px-4 py-3 pt-9 text-center sm:px-5">
                <button
                  type="button"
                  className="absolute end-2 top-2 rounded-lg px-2.5 py-1 text-sm text-[color:var(--darlink-text-muted)] hover:bg-[color:var(--darlink-surface-muted)]"
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </button>
                <p className="text-sm font-bold text-amber-900">{t("bakaModalUrgency")}</p>
                <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("bakaModalSocial")}</p>
                <h3 id="baka-modal-title" className="mt-3 text-base font-bold text-[color:var(--darlink-text)]">
                  {t("bakaModalTitle")}
                </h3>
                <p className="mt-2 rounded-lg bg-emerald-50/90 px-3 py-2 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/60">
                  {t("bakaReinforcement")}
                </p>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-gold)]">
                  {t("bakaPickPlan")}
                </p>
                <div className="grid gap-3 sm:grid-cols-1">
                  {canPickFeatured ? (
                  <button
                    type="button"
                    onClick={() => setPlan("featured")}
                    className={`w-full min-h-32 rounded-[var(--darlink-radius-xl)] border-2 p-6 text-start ${
                      plan === "featured"
                        ? "border-[var(--hadiah-btn)] bg-red-50 ring-2 ring-red-200/60"
                        : "border-[color:var(--darlink-border)] bg-red-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-[color:var(--darlink-text)]">{t("bakaPlanFeatured")}</p>
                        <p className="mt-1.5 text-base font-extrabold tabular-nums text-[var(--hadiah-btn)] sm:text-lg">
                          {t("bakaCardPrice", { amount: lineFeatured, days: featuredDurationDays })}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#D4AF37]/30 px-2.5 py-1 text-[10px] font-bold text-amber-950">
                        {t("bakaMostPopular")}
                      </span>
                    </div>
                  </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPlan("premium")}
                    className={`w-full min-h-[4.5rem] rounded-[var(--darlink-radius-xl)] border-2 p-3.5 text-start ${
                      plan === "premium"
                        ? "border-[color:var(--darlink-sand)] bg-amber-50/80 ring-2 ring-amber-200/50"
                        : "border-[color:var(--darlink-border)] bg-white"
                    }`}
                  >
                    <p className="text-sm font-bold text-[color:var(--darlink-text)]">{t("bakaPlanPremium")}</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-amber-950 sm:text-lg">
                      {t("bakaCardPrice", { amount: linePremium, days: featuredDurationDays })}
                    </p>
                  </button>
                </div>
                <div className="rounded-[var(--darlink-radius-lg)] border border-stone-200/90 bg-stone-50/80 px-3 py-2.5">
                  <ol className="list-inside list-decimal space-y-1.5 text-sm font-medium text-[color:var(--darlink-text)]" dir={isAr ? "rtl" : "ltr"}>
                    <li>{t("bakaStep1")}</li>
                    <li>{t("bakaStep2")}</li>
                    <li>{t("bakaStep3")}</li>
                  </ol>
                </div>
                <div className="space-y-1 text-xs text-[color:var(--darlink-text-muted)]">
                  <p>{t("bakaReassure1")}</p>
                  <p>{t("bakaReassure2")}</p>
                </div>
                {contact?.telHref ? (
                  <a
                    href={contact.telHref}
                    className="flex min-h-11 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border-2 border-[color:var(--darlink-navy)] bg-white px-4 text-sm font-semibold text-[color:var(--darlink-navy)]"
                  >
                    {t("makeFeaturedCall", { phone: contact.displayPhone })}
                  </a>
                ) : null}
              </div>
              <div className="sticky bottom-0 z-20 shrink-0 border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <p className="mb-2 text-center text-sm font-bold tabular-nums text-[color:var(--darlink-text)]">
                  {t("bakaStickyPrice", {
                    amount: priceForSelectedPlan,
                    days: featuredDurationDays,
                    plan: plan === "featured" ? t("bakaPlanFeatured") : t("bakaPlanPremium"),
                  })}
                </p>
                {contact ? (
                  <button
                    type="button"
                    disabled={waLoading}
                    className="flex min-h-[3.5rem] w-full items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[#25D366] px-4 text-base font-bold text-white hover:bg-[#20bd5a] active:bg-[#1daf54] disabled:opacity-60"
                    onClick={() => void onWhatsappPayClick()}
                  >
                    {waLoading ? "…" : t("bakaWhatsappCta")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="mt-2 w-full min-h-11 text-center text-sm font-medium text-[color:var(--darlink-text-muted)] underline"
                  onClick={() => {
                    trackClientAnalyticsEvent("payment_confirmed", { propertyId: listingId, payload: { listingId, plan } });
                  }}
                >
                  {t("bakaMarkProofSent")}
                </button>
                {!contact ? <p className="mt-1 text-center text-xs text-amber-900/80">{t("makeFeaturedNoAdminPhone")}</p> : null}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <Card id="make-featured" className="scroll-mt-24 border-[color:var(--darlink-sand)]/40 bg-amber-50/40 p-4 sm:p-5">
      <h2 className="text-base font-bold leading-snug text-[color:var(--darlink-text)] sm:text-lg">{t("makeFeaturedValueHeadline")}</h2>
      <ul className="mt-2.5 space-y-0.5 text-sm leading-tight text-[color:var(--darlink-text)]" dir={isAr ? "rtl" : "ltr"}>
        {valueLines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-xs leading-none text-[#D4AF37]" aria-hidden>
              ✦
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-sm font-bold tabular-nums text-[color:var(--darlink-text)]" dir="ltr">
        {t("bakaTeaserPrice", { amount: lineFeatured, days: featuredDurationDays })}
      </p>
      <p className="text-xs text-[color:var(--darlink-text-muted)]">{t("makeFeaturedPriceNote")}</p>
      <p className="mt-2 text-sm font-medium text-amber-900/90">{t("makeFeaturedUrgency")}</p>
      <p className="text-xs text-[color:var(--darlink-text-muted)]">{t("bakaTeaserSocial")}</p>
      <p className="mt-1 rounded-md bg-white/50 px-2 py-1.5 text-center text-sm font-medium text-emerald-900/90 sm:text-left">
        {t("bakaReinforcement")}
      </p>
      <Button
        type="button"
        variant="primary"
        className="mt-3 w-full min-h-12 text-base"
        onClick={onOpenModal}
      >
        {t("bakaUpgradeCta")}
      </Button>
      {err ? <p className="mt-2 text-sm text-amber-900">{err}</p> : null}
      {mounted ? modal : null}
    </Card>
  );
}
