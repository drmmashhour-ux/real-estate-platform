import type { SybnbBookingStatus } from "@/generated/prisma";

type TFn = (key: string) => string;

type Props = {
  status: SybnbBookingStatus;
  isHost: boolean;
  t: TFn;
};

const STEPS: { key: string; labelKey: string }[] = [
  { key: "requested", labelKey: "lifecycleStep_requested" },
  { key: "approved", labelKey: "lifecycleStep_approved" },
  { key: "confirmed", labelKey: "lifecycleStep_confirmed" },
  { key: "completed", labelKey: "lifecycleStep_completed" },
];

function currentStepIndex(status: SybnbBookingStatus): { idx: number; negative: true } | { idx: number; negative: false; noteKey?: "lifecycleNote_review" } {
  if (status === "declined" || status === "cancelled" || status === "refunded") {
    return { idx: -1, negative: true };
  }
  if (status === "requested") return { idx: 0, negative: false };
  if (status === "approved" || status === "payment_pending" || status === "needs_review") {
    return { idx: 1, negative: false, noteKey: status !== "approved" ? "lifecycleNote_review" : undefined };
  }
  if (status === "paid" || status === "confirmed") return { idx: 2, negative: false };
  if (status === "completed") return { idx: 3, negative: false };
  return { idx: 0, negative: false };
}

export function SybnbBookingLifecycle({ status, isHost, t }: Props) {
  const cur = currentStepIndex(status);
  if (cur.negative) {
    const endLabel =
      status === "declined" ? t("status_declined") : status === "cancelled" ? t("status_cancelled") : t("status_refunded");
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 [dir=rtl]:text-right">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("lifecycleTitle")}</p>
        <p className="mt-1 text-sm text-neutral-800">{endLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white/90 p-4 [dir=rtl]:text-right">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("lifecycleTitle")}</p>
      <ol className="grid gap-3 sm:grid-cols-4 [dir=rtl]:text-right">
        {STEPS.map((step, i) => {
          const done = i < cur.idx;
          const here = i === cur.idx;
          return (
            <li key={step.key} className="min-w-0">
              <div
                className={`flex items-start gap-2 [dir=rtl]:flex-row-reverse ${
                  here ? "text-amber-900" : done ? "text-emerald-800" : "text-neutral-400"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    here ? "bg-amber-200 text-amber-950" : done ? "bg-emerald-100 text-emerald-900" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="text-xs font-medium leading-snug">{t(step.labelKey)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {cur.negative === false && cur.noteKey ? <p className="text-xs text-amber-900/90">{t(cur.noteKey)}</p> : null}
      <div className="border-t border-neutral-100 pt-2">
        <p className="text-xs text-neutral-500">{t("nextStepLabel")}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-900">{nextStepText(status, isHost, t)}</p>
      </div>
    </div>
  );
}

function nextStepText(status: SybnbBookingStatus, isHost: boolean, t: TFn): string {
  if (status === "requested") {
    return t(isHost ? "nextStep_host_requested" : "nextStep_guest_requested");
  }
  if (status === "approved" || status === "payment_pending" || status === "needs_review") {
    if (status === "approved") {
      return t(isHost ? "nextStep_host_approved" : "nextStep_guest_approved");
    }
    return t(isHost ? "nextStep_host_pending" : "nextStep_guest_pending");
  }
  if (status === "paid" || status === "confirmed") {
    return t(isHost ? "nextStep_host_confirmed" : "nextStep_guest_confirmed");
  }
  if (status === "completed") {
    return t("nextStep_done");
  }
  return t("nextStep_generic");
}
