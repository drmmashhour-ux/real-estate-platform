import type { SybnbBooking } from "@/generated/prisma";

type Props = {
  booking: Pick<SybnbBooking, "status" | "paymentStatus">;
  /** True when the signed-in viewer is the booking guest (shows guest copy). */
  isGuest: boolean;
  t: (key: string) => string;
};

/**
 * Off-platform payment guidance for SYBNB-1 manual flows. No payment logic — copy only.
 */
export function HostPaymentInstructions({ booking, isGuest, t }: Props) {
  if (booking.status !== "approved" || booking.paymentStatus !== "manual_required") {
    return null;
  }

  if (isGuest) {
    return (
      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-5 shadow-sm [dir=rtl]:text-right">
        <div className="flex gap-3 [dir=rtl]:flex-row-reverse">
          <span className="text-xl leading-none" aria-hidden>
            💡
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-base font-semibold text-amber-950">{t("title")}</h2>
            <p className="text-sm leading-relaxed text-neutral-800">{t("guest")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 [dir=rtl]:text-right">
      <div className="rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-50 via-amber-50/80 to-white p-5 shadow-sm ring-1 ring-amber-200/60">
        <div className="flex gap-3 [dir=rtl]:flex-row-reverse">
          <span className="text-xl leading-none" aria-hidden>
            💡
          </span>
          <div className="min-w-0 flex-1 space-y-4">
            <h2 className="text-base font-semibold text-amber-950">{t("title")}</h2>
            <p className="text-sm font-medium text-amber-950/95">{t("host")}</p>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">{t("sectionWhatTitle")}</h3>
              <p className="text-sm leading-relaxed text-neutral-800">{t("whatToDoBody")}</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">{t("methodsTitle")}</h3>
              <ul className="list-disc space-y-1.5 ps-5 text-sm text-neutral-800 [dir=rtl]:pe-5 [dir=rtl]:ps-0">
                <li>{t("methodCash")}</li>
                <li>{t("methodBank")}</li>
                <li>{t("methodApps")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">{t("safetyTitle")}</h3>
              <ul className="list-disc space-y-1.5 ps-5 text-sm text-neutral-800 [dir=rtl]:pe-5 [dir=rtl]:ps-0">
                <li>{t("safetyTip1")}</li>
                <li>{t("safetyTip2")}</li>
                <li>{t("safetyTip3")}</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-red-300/80 bg-red-50 px-4 py-4 shadow-sm [dir=rtl]:flex-row-reverse">
        <span className="text-xl leading-none text-red-800" aria-hidden>
          ⚠️
        </span>
        <p className="text-sm font-semibold leading-relaxed text-red-950">{t("warning")}</p>
      </div>
    </div>
  );
}
