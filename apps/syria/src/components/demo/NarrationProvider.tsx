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
import {
  normalizeDemoRoutePath,
  narrationRouteKeyFromNormalizedPath,
  registerNarrationCaptionSetter,
  registerNarrationRuntime,
  triggerNarration,
} from "@/lib/demo/narrator";

const LS_USER_DISABLED = "syria_auto_narration_user_disabled";

export type AutoNarrationContextValue = {
  envEnabled: boolean;
  investorDemoActive: boolean;
  userNarrationEnabled: boolean;
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
  children,
}: {
  investorDemoActive: boolean;
  autoNarrationEnabled: boolean;
  autoNarrationTtsEnabled: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [caption, setCaption] = useState<string | null>(null);
  const [userNarrationEnabled, setUserNarrationEnabledState] = useState(true);
  const lastRouteKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
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
    registerNarrationCaptionSetter(setCaption);
    return () => registerNarrationCaptionSetter(null);
  }, []);

  useEffect(() => {
    registerNarrationRuntime({
      investorDemoActive,
      autoNarrationEnvEnabled: autoNarrationEnabled,
      userNarrationEnabled,
      ttsEnabled: autoNarrationTtsEnabled,
    });
    return () => registerNarrationRuntime(null);
  }, [investorDemoActive, autoNarrationEnabled, userNarrationEnabled, autoNarrationTtsEnabled]);

  useEffect(() => {
    if (!investorDemoActive || !autoNarrationEnabled || !userNarrationEnabled) {
      setCaption(null);
      try {
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }, [investorDemoActive, autoNarrationEnabled, userNarrationEnabled]);

  useEffect(() => {
    if (userNarrationEnabled) lastRouteKeyRef.current = null;
  }, [userNarrationEnabled]);

  useEffect(() => {
    if (!investorDemoActive || !autoNarrationEnabled || !userNarrationEnabled) return;
    const norm = normalizeDemoRoutePath(pathname ?? "");
    const routeKey = narrationRouteKeyFromNormalizedPath(norm);
    if (!routeKey || routeKey === lastRouteKeyRef.current) return;
    lastRouteKeyRef.current = routeKey;
    triggerNarration(routeKey);
  }, [pathname, investorDemoActive, autoNarrationEnabled, userNarrationEnabled]);

  const ctx = useMemo(
    (): AutoNarrationContextValue => ({
      envEnabled: autoNarrationEnabled,
      investorDemoActive,
      userNarrationEnabled,
      setUserNarrationEnabled,
    }),
    [autoNarrationEnabled, investorDemoActive, userNarrationEnabled, setUserNarrationEnabled],
  );

  const captionVisible =
    investorDemoActive && autoNarrationEnabled && Boolean(caption?.trim());

  return (
    <AutoNarrationContext.Provider value={ctx}>
      {children}
      <NarrationCaption visible={captionVisible} caption={caption} />
    </AutoNarrationContext.Provider>
  );
}
