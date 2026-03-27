"use client";

import { useEffect, useRef } from "react";
import { writeInvestmentProgress } from "@/lib/investment/activation-storage";

/**
 * When logged in, align **hasSaved** with server if the account has at least one saved deal.
 */
export function InvestmentProgressServerSync({ enabled }: { enabled: boolean }) {
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    void fetch("/api/investment-deals", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.resolve([])))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          writeInvestmentProgress({ hasSaved: true });
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [enabled]);

  return null;
}
