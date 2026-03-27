"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ProductHealthValue = {
  showSaveHint: boolean;
  highlightCompare: boolean;
  loaded: boolean;
};

const defaultValue: ProductHealthValue = {
  showSaveHint: false,
  highlightCompare: false,
  loaded: false,
};

const ProductHealthContext = createContext<ProductHealthValue>(defaultValue);

export function ProductHealthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<ProductHealthValue>(defaultValue);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/analytics/product-health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { showSaveHint?: boolean; highlightCompare?: boolean }) => {
        if (cancelled) return;
        setValue({
          showSaveHint: Boolean(j.showSaveHint),
          highlightCompare: Boolean(j.highlightCompare),
          loaded: true,
        });
      })
      .catch(() => {
        if (!cancelled) setValue((v) => ({ ...v, loaded: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <ProductHealthContext.Provider value={value}>{children}</ProductHealthContext.Provider>;
}

export function useProductHealth(): ProductHealthValue {
  return useContext(ProductHealthContext);
}
