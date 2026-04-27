import type { ReactNode } from "react";

type Props = {
  /** 0–100 from the trust / risk engine (e.g. {@link computeRisk}). */
  score: number;
  className?: string;
};

/**
 * Compact trust line derived from a risk score. Lower score = more trusted for display.
 */
export function TrustBadge({ score, className }: Props): ReactNode {
  if (score < 30) {
    return (
      <span className={className} title="This listing is verified under our trust policy.">
        <span aria-hidden>✅</span> Verified listing
      </span>
    );
  }
  if (score < 70) {
    return (
      <span className={className} title="This listing is being reviewed.">
        <span aria-hidden>⚠️</span> Needs review
      </span>
    );
  }
  return (
    <span className={className} title="This listing is restricted.">
      <span aria-hidden>🚫</span> Restricted
    </span>
  );
}
