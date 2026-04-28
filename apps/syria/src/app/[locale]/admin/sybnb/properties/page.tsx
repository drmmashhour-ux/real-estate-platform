import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { pickListingTitle } from "@/lib/listing-localized";
import {
  adminApproveOwnershipVerification,
  adminRejectOwnershipVerification,
  adminRejectOwnershipVerificationFraud,
  adminRequestOwnershipDocuments,
} from "@/actions/property-verification-admin";
import { SyriaPropertyStatus } from "@/generated/prisma";

async function loadOwnershipVerificationQueue() {
  return prisma.syriaProperty.findMany({
    where: {
      category: "real_estate",
      postingKind: { in: ["apartment", "house", "land"] },
      status: { in: [SyriaPropertyStatus.PUBLISHED, SyriaPropertyStatus.NEEDS_REVIEW] },
    },
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      status: true,
      postingKind: true,
      ownershipVerified: true,
      proofDocumentsSubmitted: true,
      ownershipMoreDocsRequestedAt: true,
      ownershipVerificationReviewNote: true,
      ownerName: true,
      ownerPhone: true,
      contactPhone: true,
      mandateDocumentUrl: true,
      owner: { select: { name: true, phone: true, email: true, flagged: true } },
      propertyDocuments: {
        select: { id: true, type: true, url: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ ownershipVerified: "asc" }, { updatedAt: "desc" }],
    take: 400,
  });
}

export default async function AdminSybnbPropertyOwnershipPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();
  const rows = await loadOwnershipVerificationQueue();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbPropertiesTitle")}</h2>
        <p className="text-sm text-stone-600">{t("sybnbPropertiesIntro")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-sm text-stone-600">
          {t("sybnbPropertiesQueueEmpty")}
        </p>
      ) : (
        <ul className="space-y-6">
          {rows.map((row) => {
            const title = pickListingTitle({ titleAr: row.titleAr, titleEn: row.titleEn }, locale);
            const ownerDisplay = row.ownerName?.trim() || row.owner.name?.trim() || "—";
            const phoneDisplay =
              row.ownerPhone?.trim() ||
              row.contactPhone?.trim() ||
              row.owner.phone?.trim() ||
              "—";
            const mandate = row.mandateDocumentUrl?.trim();
            const statusNeedsReview = row.status === SyriaPropertyStatus.NEEDS_REVIEW;

            return (
              <li
                key={row.id}
                className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/listing/${row.id}`}
                      className="text-lg font-semibold text-stone-900 hover:underline"
                    >
                      {title}
                    </Link>
                    <p className="text-xs text-stone-500" dir="auto">
                      {t("sybnbPropertiesPostingKind", { kind: row.postingKind ?? "—" })}
                    </p>
                    <div className="grid gap-1 text-sm text-stone-700 sm:grid-cols-2">
                      <p dir="auto">
                        <span className="font-medium text-stone-600">{t("sybnbPropertiesColOwner")}: </span>
                        {ownerDisplay}
                      </p>
                      <p dir="ltr" className="sm:text-end">
                        <span className="font-medium text-stone-600">{t("sybnbPropertiesColPhone")}: </span>
                        {phoneDisplay}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500" dir="ltr">
                      {row.owner.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={
                        statusNeedsReview ?
                          "rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-900"
                        : "rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900"
                      }
                    >
                      {statusNeedsReview ? t("sybnbPropertiesStatusNeedsReview") : t("sybnbPropertiesStatusPublished")}
                    </span>
                    {row.ownershipVerified ? (
                      <span className="rounded-full border border-emerald-400 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-950">
                        {t("sybnbPropertiesVerified")}
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                        {t("sybnbPropertiesPending")}
                      </span>
                    )}
                    {row.ownershipMoreDocsRequestedAt ? (
                      <span className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-950">
                        {t("sybnbPropertiesMoreDocs")}
                      </span>
                    ) : null}
                    {row.proofDocumentsSubmitted ? (
                      <span className="rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-950">
                        {t("sybnbPropertiesProofOnFile")}
                      </span>
                    ) : null}
                    {row.owner.flagged ? (
                      <span className="rounded-full border border-rose-400 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-950">
                        {t("sybnbPropertiesSellerFlagged")}
                      </span>
                    ) : null}
                  </div>
                </div>

                {row.ownershipVerificationReviewNote?.trim() ? (
                  <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700" dir="auto">
                    <span className="font-semibold">{t("sybnbPropertiesStoredNote")}: </span>
                    {row.ownershipVerificationReviewNote.trim()}
                  </p>
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {t("sybnbPropertiesColDocs")}
                  </p>
                  {row.propertyDocuments.length === 0 && !mandate ? (
                    <p className="text-sm text-stone-600">{t("sybnbPropertiesNoDocs")}</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {row.propertyDocuments.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                            dir="ltr"
                          >
                            {doc.type.replace(/_/g, " ")}
                          </a>
                        </li>
                      ))}
                      {mandate ?
                        <li>
                          <a
                            href={mandate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-100"
                          >
                            {t("sybnbPropertiesMandateLink")}
                          </a>
                        </li>
                      : null}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-4 border-t border-stone-100 pt-4">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <form action={adminApproveOwnershipVerification} className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                      <input type="hidden" name="propertyId" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        {t("sybnbPropertiesApprove")}
                      </button>
                    </form>

                    <form action={adminRejectOwnershipVerification} className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                      <input type="hidden" name="propertyId" value={row.id} />
                      <label className="text-xs font-medium text-stone-700">{t("sybnbPropertiesNoteLabel")}</label>
                      <textarea
                        name="note"
                        rows={2}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900"
                        placeholder={t("sybnbPropertiesNotePlaceholder")}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-stone-400 bg-white px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-stone-100"
                      >
                        {t("sybnbPropertiesRejectSoft")}
                      </button>
                    </form>

                    <form action={adminRequestOwnershipDocuments} className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/40 p-3">
                      <input type="hidden" name="propertyId" value={row.id} />
                      <label className="text-xs font-medium text-stone-700">{t("sybnbPropertiesNoteLabel")}</label>
                      <textarea
                        name="note"
                        rows={2}
                        className="rounded-lg border border-sky-300 bg-white px-2 py-1.5 text-xs text-stone-900"
                        placeholder={t("sybnbPropertiesNotePlaceholder")}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800"
                      >
                        {t("sybnbPropertiesRequestDocs")}
                      </button>
                    </form>

                    <form action={adminRejectOwnershipVerificationFraud} className="flex flex-col gap-2 rounded-xl border border-rose-300 bg-rose-50/60 p-3">
                      <input type="hidden" name="propertyId" value={row.id} />
                      <label className="text-xs font-medium text-rose-950">{t("sybnbPropertiesNoteLabel")}</label>
                      <textarea
                        name="note"
                        rows={2}
                        className="rounded-lg border border-rose-300 bg-white px-2 py-1.5 text-xs text-stone-900"
                        placeholder={t("sybnbPropertiesNotePlaceholder")}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800"
                      >
                        {t("sybnbPropertiesRejectFraud")}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
