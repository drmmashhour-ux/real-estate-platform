"use client";

import { useTranslations } from "next-intl";
import {
  computeSy8SellerScore,
  isSy8SellerVerified,
  sy8ReputationLabelId,
  type Sy8ReputationTier,
} from "@/lib/sy8/sy8-reputation";

type Owner = {
  phoneVerifiedAt: Date | null;
  verifiedAt: Date | null;
  verificationLevel: string | null;
};

type PropsWithOwner = {
  owner: Owner;
  activeListings: number;
  soldListings: number;
  className?: string;
};

type PropsPrecomputed = {
  precomputed: { sellerVerified: boolean; reputationLabelId: Sy8ReputationTier };
  className?: string;
};

type Props = PropsWithOwner | PropsPrecomputed;

function isPrecomputed(p: Props): p is PropsPrecomputed {
  return "precomputed" in p && p.precomputed != null;
}

/**
 * Trust line: seller verification (SY8) + reputation band (sold/active listing counts or pre-serialized tier).
 */
export function SybnbTrustBadge(props: Props) {
  const t8 = useTranslations("Sy8");
  if (isPrecomputed(props)) {
    const { precomputed, className = "" } = props;
    return (
      <p className={`text-[11px] leading-relaxed text-[color:var(--darlink-text-muted)] [dir:auto] ${className}`.trim()}>
        <span className="font-semibold text-neutral-800">
          {precomputed.sellerVerified ? t8("verifiedSeller") : t8("unverifiedSeller")}
        </span>
        <span> · {t8(`reputation_${precomputed.reputationLabelId}`)}</span>
      </p>
    );
  }
  const { owner, activeListings, soldListings, className = "" } = props;
  const sc = computeSy8SellerScore(soldListings, activeListings);
  const repTier = sy8ReputationLabelId(sc);
  return (
    <p className={`text-[11px] leading-relaxed text-[color:var(--darlink-text-muted)] [dir:auto] ${className}`.trim()}>
      <span className="font-semibold text-neutral-800">
        {isSy8SellerVerified(owner) ? t8("verifiedSeller") : t8("unverifiedSeller")}
      </span>
      <span> · {t8(`reputation_${repTier}`)}</span>
    </p>
  );
}
