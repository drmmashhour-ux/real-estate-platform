"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { LISTING_IMAGE_QUALITY } from "@/lib/design-tokens";
import { SYRIA_BROWSE_PAGE_SIZE_DEFAULT } from "@/lib/syria/sybn104-performance";

const STORAGE_KEY = "hadiah_data_saver_v1";

/** ORDER SYBNB-79 / SYBNB-104 — tighter thumbnails when data saver is on. */
export const SYBNB79_LISTING_IMAGE_QUALITY = 26;

/** @deprecated Use `SYRIA_BROWSE_PAGE_SIZE_DEFAULT` from `@/lib/syria/sybn104-performance`. */
export const SYBNB79_BROWSE_PAGE_SIZE = SYRIA_BROWSE_PAGE_SIZE_DEFAULT;

export type DataSaverContextValue = {
  hydrated: boolean;
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  toggle: () => void;
  /** Pass to `next/image` quality prop for listing thumbnails. */
  listingImageQuality: number;
};

const DataSaverContext = createContext<DataSaverContextValue | null>(null);

function readStored(): boolean | null {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r === "1") return true;
    if (r === "0") return false;
  } catch {
    /* ignore */
  }
  return null;
}

function defaultMobileOn(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 639px)").matches;
}

function DataSaverToast({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("Browse");

  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-[60] max-w-[min(100%,22rem)] -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center shadow-lg [dir=rtl]:text-right md:bottom-8"
    >
      <p className="text-sm font-semibold text-emerald-950">{t("dataSaverActivatedToast")}</p>
      <button
        type="button"
        className="mt-2 text-xs font-medium text-emerald-900 underline underline-offset-2"
        onClick={onDismiss}
      >
        {t("dataSaverToastDismiss")}
      </button>
    </div>
  );
}

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const stored = readStored();
    const mobile = defaultMobileOn();
    const next = stored !== null ? stored : mobile;
    setEnabledState(next);
    if (stored === null) {
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next) setToastVisible(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const id = window.setTimeout(() => setToastVisible(false), 5200);
    return () => window.clearTimeout(id);
  }, [toastVisible]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState((prev) => {
      if (!prev && next) setToastVisible(true);
      return next;
    });
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev;
      if (!prev && next) setToastVisible(true);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const listingImageQuality = enabled ? SYBNB79_LISTING_IMAGE_QUALITY : LISTING_IMAGE_QUALITY;

  const value = useMemo<DataSaverContextValue>(
    () => ({
      hydrated,
      enabled,
      setEnabled,
      toggle,
      listingImageQuality,
    }),
    [hydrated, enabled, setEnabled, toggle, listingImageQuality],
  );

  return (
    <DataSaverContext.Provider value={value}>
      {children}
      {hydrated && toastVisible ? <DataSaverToast onDismiss={() => setToastVisible(false)} /> : null}
    </DataSaverContext.Provider>
  );
}

/** Hooks outside provider return defaults (SSR / tests). */
export function useDataSaverOptional(): DataSaverContextValue {
  const ctx = useContext(DataSaverContext);
  return (
    ctx ?? {
      hydrated: false,
      enabled: false,
      setEnabled: () => {},
      toggle: () => {},
      listingImageQuality: LISTING_IMAGE_QUALITY,
    }
  );
}

export function useDataSaver(): DataSaverContextValue {
  const ctx = useContext(DataSaverContext);
  if (!ctx) {
    throw new Error("useDataSaver must be used within DataSaverProvider");
  }
  return ctx;
}
