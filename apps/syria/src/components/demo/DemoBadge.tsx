import { isInvestorDemoModeActive, isProductionLockActiveForDisplay } from "@/lib/sybnb/investor-demo";

const styles: Record<string, string> = {
  verifiedHost: "bg-emerald-100 text-emerald-900 border-emerald-200",
  approvedStay: "bg-sky-100 text-sky-900 border-sky-200",
  paymentProtected: "bg-violet-100 text-violet-900 border-violet-200",
  payoutReview: "bg-amber-100 text-amber-900 border-amber-200",
  demoData: "bg-neutral-200 text-neutral-800 border-neutral-300",
  prodLock: "bg-rose-100 text-rose-900 border-rose-200",
};

type Variant = keyof typeof styles;

type Props = { variant: Variant; children: React.ReactNode };

export function DemoBadge({ variant, children }: Props) {
  if (!isInvestorDemoModeActive()) {
    return null;
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant] ?? styles.demoData}`}
    >
      {children}
    </span>
  );
}

export function ProductionLockStrip() {
  if (!isInvestorDemoModeActive() || !isProductionLockActiveForDisplay()) {
    return null;
  }
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2 text-sm text-rose-950 [dir=rtl]:text-right">
      <span className="font-semibold">Production lock</span> — real card payments are not enabled; flows remain
      stubbed or blocked by policy.
    </div>
  );
}
