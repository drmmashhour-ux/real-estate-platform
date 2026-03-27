"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Shows after Stripe return URL includes upgrade=success&closing=1 (see /api/closing/checkout).
 */
export function PostUpgradeSuccessBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ok = searchParams.get("upgrade") === "success";
    const closing = searchParams.get("closing") === "1";
    setVisible(ok && closing);
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
      <p className="font-medium text-white">You&apos;re upgraded</p>
      <p className="mt-1 text-emerald-200/90">
        Limits are lifted on your account. Keep running simulations and saving scenarios — Pro tools stay on.
      </p>
    </div>
  );
}
