import { getTranslations } from "next-intl/server";
import {
  SYBNB_TITLE_STRUCTURE_HINT_AR,
  SYBNB_TITLE_STRUCTURE_HINT_EN,
  SYBNB_WHATSAPP_AUTOMATION_AR,
  sybnbNightlySypHintRangeForCity,
} from "@/lib/sybnb/automation-presets";
import { SYRIA_PRICING } from "@/lib/pricing";

/**
 * SYBNB-18 — Operator cheatsheet on the MVP sell screen (templates + WhatsApp snippets).
 */
export async function SellAutomationHints({ locale }: { locale: string }) {
  const t = await getTranslations("SellMvp.automation");
  const isAr = locale.startsWith("ar");
  const range = sybnbNightlySypHintRangeForCity("");
  const nf = new Intl.NumberFormat(isAr ? "ar-SY" : "en-US", { maximumFractionDigits: 0 });
  const currency = SYRIA_PRICING.currency;

  const titlePattern = isAr ? SYBNB_TITLE_STRUCTURE_HINT_AR : SYBNB_TITLE_STRUCTURE_HINT_EN;

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 text-sm text-[color:var(--darlink-text)] [dir=rtl]:text-right">
      <div>
        <p className="font-semibold text-emerald-950">{t("sectionTitle")}</p>
        <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("sectionSubtitle")}</p>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-white/90 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">{t("titlePatternLabel")}</p>
        <p className="mt-1 font-mono text-xs leading-relaxed text-neutral-800 [overflow-wrap:anywhere]" dir="auto">
          {titlePattern}
        </p>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-white/90 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">{t("priceHintLabel")}</p>
        <p className="mt-1 text-xs text-neutral-700">
          {t("priceHintBody", {
            currency,
            min: nf.format(range.min),
            max: nf.format(range.max),
          })}
        </p>
      </div>
      <details className="rounded-xl border border-neutral-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-neutral-900">{t("waTemplatesSummary")}</summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed">
          <div>
            <p className="font-medium text-neutral-700">{t("waIntroLabel")}</p>
            <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-2 font-sans text-neutral-800 [overflow-wrap:anywhere]" dir="rtl">
              {SYBNB_WHATSAPP_AUTOMATION_AR.intro}
            </pre>
          </div>
          <div>
            <p className="font-medium text-neutral-700">{t("waFollowLabel")}</p>
            <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-2 font-sans text-neutral-800 [overflow-wrap:anywhere]" dir="rtl">
              {SYBNB_WHATSAPP_AUTOMATION_AR.followUp}
            </pre>
          </div>
          <div>
            <p className="font-medium text-neutral-700">{t("waCloseLabel")}</p>
            <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-2 font-sans text-neutral-800 [overflow-wrap:anywhere]" dir="rtl">
              {SYBNB_WHATSAPP_AUTOMATION_AR.closing}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}
