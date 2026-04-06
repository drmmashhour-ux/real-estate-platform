"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "lecipm_a11y_enhanced";

type AccessibilityPreferencesContextValue = {
  /** Larger type, higher contrast, minimal motion. */
  enhanced: boolean;
  setEnhanced: (v: boolean) => void;
  toggleEnhanced: () => void;
};

const AccessibilityPreferencesContext = createContext<AccessibilityPreferencesContextValue | null>(null);

export function AccessibilityPreferencesProvider({ children }: { children: ReactNode }) {
  const [enhanced, setEnhancedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setEnhancedState(typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.setAttribute("data-a11y-mode", enhanced ? "enhanced" : "default");
    try {
      window.localStorage.setItem(STORAGE_KEY, enhanced ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [enhanced, hydrated]);

  const setEnhanced = useCallback((v: boolean) => setEnhancedState(v), []);
  const toggleEnhanced = useCallback(() => setEnhancedState((e) => !e), []);

  const value = useMemo(
    () => ({ enhanced, setEnhanced, toggleEnhanced }),
    [enhanced, setEnhanced, toggleEnhanced]
  );

  return (
    <AccessibilityPreferencesContext.Provider value={value}>{children}</AccessibilityPreferencesContext.Provider>
  );
}

export function useAccessibilityPreferences(): AccessibilityPreferencesContextValue {
  const ctx = useContext(AccessibilityPreferencesContext);
  if (!ctx) {
    return {
      enhanced: false,
      setEnhanced: () => {},
      toggleEnhanced: () => {},
    };
  }
  return ctx;
}
