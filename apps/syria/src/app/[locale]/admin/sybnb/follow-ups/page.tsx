import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SybnbFollowUpCopyButton } from "@/components/admin/SybnbFollowUpCopyButton";
import {
  SYBNB70_MANUAL_FOLLOW_UP_MESSAGE_AR,
  SYBNB70_FOLLOW_UP_MIN_AGE_H,
  SYBNB70_FOLLOW_UP_MAX_AGE_H,
} from "@/lib/sybnb/sybnb-manual-follow-up";
import { listInquiriesForManualFollowUpWindow } from "@/lib/sybnb/sybnb-follow-up-queue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("followUpsPageTitle"),
    description: t("followUpsSubtitle"),
  };
}

export default async function AdminSybnbFollowUpsPage() {
  const t = await getTranslations("Admin");
  const rows = await listInquiriesForManualFollowUpWindow({
    minHours: SYBNB70_FOLLOW_UP_MIN_AGE_H,
    maxHours: SYBNB70_FOLLOW_UP_MAX_AGE_H,
  });

  return (
    <div className="space-y-8 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("followUpsKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("followUpsTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("followUpsSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("followUpsTrackedSignalsTitle")}</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("followUpsTrackedContact")}</li>
          <li>{t("followUpsTrackedListingOpen")}</li>
          <li>{t("followUpsTrackedMessage")}</li>
        </ul>
        <p className="mt-4 text-xs text-stone-500">{t("followUpsTrackedFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("followUpsOperatorRhythmTitle")}</h2>
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("followUpsOperatorRhythm1")}</li>
          <li>{t("followUpsOperatorRhythm2")}</li>
          <li>{t("followUpsOperatorRhythm3")}</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">{t("followUpsTemplateTitle")}</h2>
            <p className="mt-1 text-sm text-stone-600">{t("followUpsTemplateLead")}</p>
          </div>
          <SybnbFollowUpCopyButton
            text={SYBNB70_MANUAL_FOLLOW_UP_MESSAGE_AR}
            idleLabel={t("followUpsCopyCta")}
            copiedLabel={t("followUpsCopyDone")}
          />
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-sans text-sm leading-relaxed text-stone-800">
          {SYBNB70_MANUAL_FOLLOW_UP_MESSAGE_AR}
        </pre>
        <p className="mt-3 text-xs text-stone-500">{t("followUpsWindowHint", { min: SYBNB70_FOLLOW_UP_MIN_AGE_H, max: SYBNB70_FOLLOW_UP_MAX_AGE_H })}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("followUpsQueueTitle")}</h2>
        <p className="mt-1 text-sm text-stone-600">{t("followUpsQueueLead")}</p>
        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-stone-600">{t("followUpsQueueEmpty")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-start text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pe-4">{t("followUpsColWhen")}</th>
                  <th className="py-2 pe-4">{t("followUpsColListing")}</th>
                  <th className="py-2 pe-4">{t("followUpsColGuest")}</th>
                  <th className="py-2 pe-4">{t("followUpsColPhone")}</th>
                  <th className="py-2">{t("followUpsColNote")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.inquiryId} className="border-b border-stone-100 align-top">
                    <td className="py-3 pe-4 whitespace-nowrap text-stone-800">
                      {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="py-3 pe-4">
                      <Link href={`/listing/${r.propertyId}`} className="font-medium text-amber-900 underline-offset-2 hover:underline">
                        {r.propertyTitleAr}
                      </Link>
                      <div className="text-xs text-stone-500">{r.city}</div>
                      {r.needsReview ? (
                        <span className="mt-1 inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-900 ring-1 ring-rose-200">
                          {t("followUpsNeedsReviewBadge")}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pe-4">{r.guestName}</td>
                    <td className="py-3 pe-4 font-mono text-xs [direction:ltr]">{r.phone}</td>
                    <td className="py-3 max-w-xs text-stone-700">{r.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-stone-500">{t("followUpsFutureNote")}</p>
    </div>
  );
}
