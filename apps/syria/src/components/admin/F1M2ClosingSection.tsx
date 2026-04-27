"use client";

import { useTranslations } from "next-intl";
import { CopyTextBlock } from "@/components/admin/CopyTextBlock";
import {
  F1_M2_AFTER_PAYMENT_AR,
  F1_M2_FOLLOWUP_AR,
  F1_M2_STANDARD_REPLY_AR,
} from "@/lib/monetization-f1-m2-playbooks";

export function F1M2ClosingSection() {
  const t = useTranslations("Admin");

  return (
    <section className="rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/80 to-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-amber-950">{t("f1M2SectionTitle")}</h3>
      <p className="mt-1 text-sm text-stone-600">{t("f1M2SectionIntro")}</p>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{t("f1M2StandardTitle")}</p>
          <CopyTextBlock
            text={F1_M2_STANDARD_REPLY_AR}
            copyLabel={t("f1M2Copy")}
            copiedLabel={t("f1M2Copied")}
            dir="rtl"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{t("f1M2AfterPaymentTitle")}</p>
          <CopyTextBlock
            text={F1_M2_AFTER_PAYMENT_AR}
            copyLabel={t("f1M2Copy")}
            copiedLabel={t("f1M2Copied")}
            dir="rtl"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{t("f1M2FollowupTitle")}</p>
          <p className="mb-2 text-xs text-stone-500">{t("f1M2FollowupHint")}</p>
          <CopyTextBlock
            text={F1_M2_FOLLOWUP_AR}
            copyLabel={t("f1M2Copy")}
            copiedLabel={t("f1M2Copied")}
            dir="rtl"
          />
        </div>
      </div>
    </section>
  );
}
