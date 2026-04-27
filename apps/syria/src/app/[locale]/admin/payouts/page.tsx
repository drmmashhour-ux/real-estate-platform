import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import {
  approvePayout,
  approveSybnbPayoutRelease,
  blockSybnbPayout,
  markPayoutPaid,
} from "@/actions/admin";
import { money } from "@/lib/format";
import { describePayoutEligibility } from "@/lib/payout-policy";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { sybnbConfig } from "@/config/sybnb.config";

export default async function AdminPayoutsPage() {
  const t = await getTranslations("Admin");

  const payouts = await prisma.syriaPayout.findMany({
    include: {
      booking: { include: { property: { select: { category: true, titleAr: true } } } },
      host: true,
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const autonomyQuickLink = getDarlinkAutonomyFlags().AUTONOMY_ENABLED ? (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-950">
      <Link href="/admin/autonomy" className="font-semibold underline underline-offset-2 hover:text-indigo-900">
        Marketplace autonomy dashboard
      </Link>
      <p className="mt-2 text-xs text-indigo-900/80">Payout stress signals remain approval-gated — see policy notes there.</p>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("tilePayouts")}</h2>
        <p className="text-sm text-stone-600">{t("payoutsIntro")}</p>
      </div>
      {autonomyQuickLink}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-3">{t("tableHost")}</th>
              <th className="px-3 py-3">{t("tableStay")}</th>
              <th className="px-3 py-3">{t("tableHostShare")}</th>
              <th className="px-3 py-3">{t("tablePlatformFee")}</th>
              <th className="px-3 py-3">{t("tableLedger")}</th>
              {sybnbConfig.escrowEnabled ? <th className="px-3 py-3">{t("tableEscrow")}</th> : null}
              {sybnbConfig.escrowEnabled ? <th className="px-3 py-3">{t("tableReleaseEligible")}</th> : null}
              {sybnbConfig.escrowEnabled ? <th className="px-3 py-3">{t("tableRisk")}</th> : null}
              {sybnbConfig.escrowEnabled ? <th className="px-3 py-3">{t("tableBlocked")}</th> : null}
              {sybnbConfig.escrowEnabled ? <th className="px-3 py-3">{t("tableReleasedAt")}</th> : null}
              <th className="px-3 py-3">{t("tableGuidance")}</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => {
              const hint = describePayoutEligibility({ checkedInAt: p.booking.checkedInAt });
              const isStay = p.booking.property.category === "stay";
              const escrowUi = sybnbConfig.escrowEnabled && isStay;

              return (
                <tr key={p.id} className="border-t border-stone-100 align-top">
                  <td className="px-3 py-3 text-xs text-stone-700">{p.host.email}</td>
                  <td className="px-3 py-3 text-xs text-stone-600">
                    {isStay ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-950">stay</span>
                    ) : (
                      <span className="text-stone-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{money(p.amount, p.currency)}</td>
                  <td className="px-3 py-3">{money(p.platformFee, p.currency)}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium">{p.status}</span>
                  </td>
                  {sybnbConfig.escrowEnabled ? (
                    <td className="px-3 py-3 text-xs">{escrowUi ? p.escrowStatus : "—"}</td>
                  ) : null}
                  {sybnbConfig.escrowEnabled ? (
                    <td className="px-3 py-3 text-xs text-stone-600">
                      {escrowUi && p.releaseEligibleAt
                        ? p.releaseEligibleAt.toISOString().slice(0, 16).replace("T", " ")
                        : "—"}
                    </td>
                  ) : null}
                  {sybnbConfig.escrowEnabled ? (
                    <td className="px-3 py-3 text-xs">{escrowUi ? p.riskStatus : "—"}</td>
                  ) : null}
                  {sybnbConfig.escrowEnabled ? (
                    <td className="max-w-[140px] px-3 py-3 text-xs text-stone-600">
                      {escrowUi && p.blockedReason ? p.blockedReason : "—"}
                    </td>
                  ) : null}
                  {sybnbConfig.escrowEnabled ? (
                    <td className="px-3 py-3 text-xs text-stone-600">
                      {escrowUi && p.releasedAt ? p.releasedAt.toISOString().slice(0, 16).replace("T", " ") : "—"}
                    </td>
                  ) : null}
                  <td className="px-3 py-3 text-xs text-stone-600">{hint.notes}</td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-[180px] flex-col gap-2">
                      {escrowUi && p.status === "PENDING" ? (
                        <>
                          <form action={approveSybnbPayoutRelease}>
                            <input type="hidden" name="payoutId" value={p.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                            >
                              {t("payoutApproveEscrow")}
                            </button>
                          </form>
                          <form action={blockSybnbPayout} className="flex flex-col gap-1">
                            <input type="hidden" name="payoutId" value={p.id} />
                            <textarea
                              name="blockedReason"
                              required
                              rows={2}
                              placeholder={t("payoutBlockReasonPlaceholder")}
                              className="w-full rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-800"
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-900 hover:bg-red-100"
                            >
                              {t("payoutBlockEscrow")}
                            </button>
                          </form>
                        </>
                      ) : null}
                      {!escrowUi && p.status === "PENDING" ? (
                        <form action={approvePayout}>
                          <input type="hidden" name="payoutId" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            {t("payoutApprove")}
                          </button>
                        </form>
                      ) : null}
                      {p.status === "APPROVED" ? (
                        <form action={markPayoutPaid}>
                          <input type="hidden" name="payoutId" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                          >
                            {t("payoutMarkPaid")}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
