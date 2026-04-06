"use client";

import { useCallback, useEffect, useState } from "react";

export type ClientMarketSnapshot = {
  code: string;
  defaultCurrency: string;
  paymentMode: string;
  bookingMode: string;
  contactDisplayMode: string;
  onlinePaymentsEnabled: boolean;
  manualPaymentTrackingEnabled: boolean;
  contactFirstEmphasis: boolean;
  suggestedDefaultLocale: string;
  legalDisclaimerMessageKey: string;
};

export function useMarketConfig() {
  const [market, setMarket] = useState<ClientMarketSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetch("/api/market/resolved", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        setMarket(j as ClientMarketSnapshot);
        setError(null);
      })
      .catch(() => setError("unavailable"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    market,
    error,
    refresh,
    isLoading: market === null && error === null,
    isContactFirstMarket: Boolean(market?.contactFirstEmphasis),
    isManualFirstBookingMarket: market?.bookingMode === "manual_first",
    supportsOnlinePayments: market?.onlinePaymentsEnabled ?? true,
    isManualPaymentTrackingEnabled: market?.manualPaymentTrackingEnabled ?? false,
  };
}
