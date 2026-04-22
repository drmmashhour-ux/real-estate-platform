"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  SENIOR_FAMILY_MODE_STORAGE_KEY,
  SENIOR_SIMPLE_MODE_STORAGE_KEY,
} from "@/theme/senior-mode";
import "./senior-living-accessible.css";

type Ctx = {
  simpleMode: boolean;
  setSimpleMode: (v: boolean) => void;
  familyHelperMode: boolean;
  setFamilyHelperMode: (v: boolean) => void;
};

const SeniorLivingA11yContext = createContext<Ctx | null>(null);

export function useSeniorLivingAccessibility(): Ctx {
  const v = useContext(SeniorLivingA11yContext);
  if (!v) throw new Error("useSeniorLivingAccessibility must be used under SeniorLivingAccessibilityProvider");
  return v;
}

export function SeniorLivingAccessibilityProvider(props: { children: ReactNode }) {
  const [simpleMode, setSimpleModeState] = useState(false);
  const [familyHelperMode, setFamilyHelperModeState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SENIOR_SIMPLE_MODE_STORAGE_KEY);
      setSimpleModeState(s === "1" || s === "true");
      const f = localStorage.getItem(SENIOR_FAMILY_MODE_STORAGE_KEY);
      setFamilyHelperModeState(f === "1" || f === "true");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setSimpleMode = useCallback((v: boolean) => {
    setSimpleModeState(v);
    try {
      localStorage.setItem(SENIOR_SIMPLE_MODE_STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const setFamilyHelperMode = useCallback((v: boolean) => {
    setFamilyHelperModeState(v);
    try {
      localStorage.setItem(SENIOR_FAMILY_MODE_STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ simpleMode, setSimpleMode, familyHelperMode, setFamilyHelperMode }),
    [simpleMode, setSimpleMode, familyHelperMode, setFamilyHelperMode]
  );

  const rootClass =
    `senior-living-accessible min-h-screen bg-white text-neutral-900 ${simpleMode ? "senior-living-simple-mode" : ""}`;

  return (
    <SeniorLivingA11yContext.Provider value={value}>
      <div className={rootClass} data-senior-simple-mode={simpleMode ? "true" : "false"} data-hydrated={hydrated}>
        {props.children}
      </div>
    </SeniorLivingA11yContext.Provider>
  );
}
