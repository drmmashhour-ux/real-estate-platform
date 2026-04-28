import type { SybnbBooking } from "@/generated/prisma";
import { getBookingTimeline } from "@/lib/sybnb/booking-timeline";

const ICON: Record<string, string> = {
  requested: "📨",
  approved: "✔",
  payment: "💳",
};

type Props = {
  booking: Pick<SybnbBooking, "status" | "paymentStatus" | "createdAt">;
  /** `useTranslations('Sybnb.timeline')` or server `getTranslations` result */
  t: (key: string) => string;
};

function rowTone(step: { completed: boolean; current: boolean }): { dot: string; text: string } {
  if (step.completed) {
    return {
      dot: "border-emerald-500 bg-emerald-50 text-emerald-800",
      text: "text-emerald-950",
    };
  }
  if (step.current) {
    return {
      dot: "border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300/80",
      text: "font-semibold text-amber-950",
    };
  }
  return {
    dot: "border-neutral-200 bg-neutral-50 text-neutral-500",
    text: "text-neutral-500",
  };
}

export function BookingTimeline({ booking, t }: Props) {
  const steps = getBookingTimeline(booking);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm [dir=rtl]:text-right">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("sectionTitle")}</p>
      <ol className="mt-4 space-y-0">
        {steps.map((step, i) => {
          const tone = rowTone(step);
          const label =
            step.key === "requested"
              ? t("requested")
              : step.key === "approved"
                ? t("approved")
                : t("payment");
          const showCheck = step.completed;
          const isLast = i === steps.length - 1;

          return (
            <li key={step.key} className="flex gap-3 [dir=rtl]:flex-row-reverse">
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${tone.dot}`}
                  aria-hidden
                >
                  {ICON[step.key] ?? "•"}
                </span>
                {!isLast ? <span className="my-1 min-h-[20px] w-px flex-1 bg-neutral-200" aria-hidden /> : null}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <div className={`flex flex-wrap items-center gap-2 text-sm ${tone.text}`}>
                  <span>{label}</span>
                  {showCheck ? <span className="text-emerald-600">✓</span> : null}
                </div>
                {step.date ? (
                  <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
                    {step.date.toISOString().slice(0, 19)}Z
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
