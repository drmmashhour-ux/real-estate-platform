import {
  LEGAL_BOUNDARY_BROKERED_DISCLOSURE_EN,
  LEGAL_BOUNDARY_FSBO_DISCLOSURE_EN,
} from "@/modules/legal-boundary/transaction-context.types";
import type { TransactionMode } from "@/modules/legal-boundary/transaction-context.types";

export function TransactionModeBanner({
  mode,
  complianceState,
}: {
  mode: TransactionMode;
  complianceState?: "SAFE" | "RESTRICTED" | "BLOCKED";
}) {
  if (complianceState === "BLOCKED") {
    return (
      <aside
        className="mb-4 rounded-xl border border-rose-500/50 bg-rose-950/50 p-3 text-sm text-rose-50"
        aria-label="Compliance notice"
      >
        <strong className="text-rose-200">Compliance hold</strong>
        <p className="mt-1 text-rose-100/90">
          This property has an active brokerage compliance hold. Do not rely on automated tools until a licensed broker
          clears the file.
        </p>
      </aside>
    );
  }

  if (mode === "BROKERED") {
    return (
      <aside
        className="mb-4 rounded-xl border border-emerald-500/45 bg-emerald-950/45 p-3 text-sm text-emerald-50"
        aria-label="Broker assisted"
      >
        <span className="inline-flex items-center gap-2 font-semibold text-emerald-200">
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-100">
            Broker assisted
          </span>
        </span>
        <p className="mt-2 text-emerald-100/90">{LEGAL_BOUNDARY_BROKERED_DISCLOSURE_EN}</p>
        {complianceState === "RESTRICTED" ? (
          <p className="mt-2 text-xs text-amber-200/95">
            Licence or scope warning on file — confirm property classification with the listing broker before acting.
          </p>
        ) : null}
      </aside>
    );
  }

  return (
    <aside
      className="mb-4 rounded-xl border border-amber-500/55 bg-amber-950/40 p-3 text-sm text-amber-50"
      aria-label="Independent transaction"
    >
      <span className="inline-flex items-center gap-2 font-semibold text-amber-200">
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs uppercase tracking-wide text-amber-100">
          Independent (no broker)
        </span>
      </span>
      <p className="mt-2 text-amber-100/90">{LEGAL_BOUNDARY_FSBO_DISCLOSURE_EN}</p>
    </aside>
  );
}
