"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { NarrationCaption } from "@/components/demo/NarrationCaption";
import type { NarrationLang } from "@/lib/demo/narration-registry";
import {
  cancelActiveNarrationPlayback,
  isAutomaticRouteNarrationSuppressed,
  narrationLocaleFromPathname,
  narrationRouteKeyFromNormalizedPath,
  normalizeDemoRoutePath,
  registerNarrationCaptionSetter,
  registerNarrationLocale,
  registerNarrationRuntime,
  triggerNarration,
} from "@/lib/demo/narrator";

const LS_USER_DISABLED = "syria_auto_narration_user_disabled";

export type AutoNarrationContextValue = {
  envEnabled: boolean;
  investorDemoActive: boolean;
  userNarrationEnabled: boolean;
  /** Mirrors server `AI_NARRATION_ENABLED` — demo-panel AI voice toggle is client-only. */
  aiNarrationEnvEnabled: boolean;
  setUserNarrationEnabled: (enabled: boolean) => void;
};

const AutoNarrationContext = createContext<AutoNarrationContextValue | null>(null);

export function useAutoNarration(): AutoNarrationContextValue | null {
  return useContext(AutoNarrationContext);
}

export function NarrationProvider({
  investorDemoActive,
  autoNarrationEnabled,
  autoNarrationTtsEnabled,
  aiNarrationEnvEnabled,
  children,
}: {
  investorDemoActive: boolean;
  autoNarrationEnabled: boolean;
  autoNarrationTtsEnabled: boolean;
  aiNarrationEnvEnabled: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const localeFromPath = useMemo(
    () => narrationLocaleFromPathname(pathname ?? ""),
    [pathname],
  );

  const [captionText, setCaptionText] = useState<string | null>(null);
  const [captionLocale, setCaptionLocale] = useState<NarrationLang>(localeFromPath);
  const [userNarrationEnabled, setUserNarrationEnabledState] = useState(true);
  const lastNarrationFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Hydrate user toggle from localStorage after mount (client-only).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted preference once on mount
      setUserNarrationEnabledState(localStorage.getItem(LS_USER_DISABLED) !== "1");
    } catch {
      setUserNarrationEnabledState(true);
    }
  }, []);

  const setUserNarrationEnabled = useCallback((enabled: boolean) => {
    setUserNarrationEnabledState(enabled);
    try {
      if (!enabled) localStorage.setItem(LS_USER_DISABLED, "1");
      else localStorage.removeItem(LS_USER_DISABLED);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    registerNarrationCaptionSetter((text, locale) => {
      setCaptionText(text);
      setCaptionLocale(locale);
    });
    return () => registerNarrationCaptionSetter(null);
  }, []);

  useEffect(() => {
    registerNarrationLocale(localeFromPath);
  }, [localeFromPath]);

  useEffect(() => {
    registerNarrationRuntime({
      investorDemoActive,
      autoNarrationEnvEnabled: autoNarrationEnabled,
      userNarrationEnabled,
      ttsEnabled: autoNarrationTtsEnabled,
      aiNarrationEnvEnabled,
    });
    return () => registerNarrationRuntime(null);
  }, [
    investorDemoActive,
    autoNarrationEnabled,
    userNarrationEnabled,
    autoNarrationTtsEnabled,
    aiNarrationEnvEnabled,
  ]);

  useEffect(() => {
    if (!investorDemoActive || !autoNarrationEnabled || !userNarrationEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale caption when narration is gated off
      setCaptionText(null);
      setCaptionLocale(localeFromPath);
      cancelActiveNarrationPlayback();
    }
  }, [investorDemoActive, autoNarrationEnabled, userNarrationEnabled, localeFromPath]);

  useEffect(() => {
    if (userNarrationEnabled) lastNarrationFingerprintRef.current = null;
  }, [userNarrationEnabled]);

  useEffect(() => {
    if (!investorDemoActive || !autoNarrationEnabled || !userNarrationEnabled) return;
    if (isAutomaticRouteNarrationSuppressed()) return;
    const norm = normalizeDemoRoutePath(pathname ?? "");
    const routeKey = narrationRouteKeyFromNormalizedPath(norm);
    if (!routeKey) return;
    const fingerprint = `${localeFromPath}:${routeKey}`;
    if (fingerprint === lastNarrationFingerprintRef.current) return;
    lastNarrationFingerprintRef.current = fingerprint;
    triggerNarration(routeKey, localeFromPath);
  }, [pathname, localeFromPath, investorDemoActive, autoNarrationEnabled, userNarrationEnabled]);

  const ctx = useMemo(
    (): AutoNarrationContextValue => ({
      envEnabled: autoNarrationEnabled,
      investorDemoActive,
      userNarrationEnabled,
      aiNarrationEnvEnabled,
      setUserNarrationEnabled,
    }),
    [autoNarrationEnabled, investorDemoActive, userNarrationEnabled, aiNarrationEnvEnabled, setUserNarrationEnabled],
  );

  const captionVisible =
    investorDemoActive && autoNarrationEnabled && Boolean(captionText?.trim());

  return (
    <AutoNarrationContext.Provider value={ctx}>
      {children}
      <NarrationCaption visible={captionVisible} caption={captionText} locale={captionLocale} />
    </AutoNarrationContext.Provider>
  );
}
