"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getNetworkMode, type NetworkUiMode } from "@/lib/core/network";
import {
  readLiteModePreference,
  type LiteModePreference,
} from "@/lib/lite/lite-mode-client";

const AUTO_DEBOUNCE_MS = 8_000;
const STICKY_LITE_MS = 10_000;

export type SyriaModeRouting = NetworkUiMode;

function preferenceToEffective(pref: LiteModePreference, network: NetworkUiMode): SyriaModeRouting {
  if (pref === "on") return "lite";
  if (pref === "off") return "rich";
  return network;
}

/** Map non-lite paths to lite equivalents (`usePathname` is locale-less in next-intl). */
export function mapSyriaRichPathToLite(pathname: string): string | null {
  if (pathname.startsWith("/lite")) return null;

  if (pathname === "/sybnb" || pathname.startsWith("/sybnb/")) {
    if (pathname === "/sybnb") return "/lite/sybnb";
    if (pathname.startsWith("/sybnb/listings")) return "/lite/listings";
    if (pathname.startsWith("/sybnb/bookings")) return "/lite/requests";
    if (pathname.startsWith("/sybnb/requests")) return "/lite/requests";
    if (pathname.startsWith("/sybnb/host") || pathname.startsWith("/sybnb/agents"))
      return "/lite/listings";
    return "/lite/listings";
  }

  return null;
}

/** When user chooses full UI from lite — best-effort map back to rich SYBNB. */
export function mapSyriaLitePathToRich(pathname: string): string | null {
  if (!pathname.startsWith("/lite")) return null;
  if (pathname.startsWith("/lite/sybnb") || pathname === "/lite") return "/sybnb";
  if (pathname.startsWith("/lite/listings")) return "/sybnb";
  if (pathname.startsWith("/lite/requests") || pathname.startsWith("/lite/chat")) return "/sybnb";
  return "/sybnb";
}

type SyriaModeContextValue = {
  hydrated: boolean;
  preference: LiteModePreference;
  setPreference: (p: LiteModePreference) => void;
  effectiveMode: SyriaModeRouting;
  /** Immediate network hint before preference wiring (auto only). */
  networkMode: NetworkUiMode;
  suggestFullVersion: boolean;
  dismissSuggest: () => void;
  toggleLiteMode: () => void;
};

const SyriaModeContext = createContext<SyriaModeContextValue | null>(null);

export function SyriaModeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const [hydrated, setHydrated] = useState(false);
  const [preference, setPreferenceState] = useState<LiteModePreference>("auto");
  const [networkMode, setNetworkMode] = useState<NetworkUiMode>("rich");
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [suggestTick, setSuggestTick] = useState(0);
  const [suggestFullVersion, setSuggestFullVersion] = useState(false);

  const lastNavAtRef = useRef(0);
  const stickyLiteUntilRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleApplyNetwork = useCallback((next: NetworkUiMode) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      setNetworkMode(next);
    }, AUTO_DEBOUNCE_MS);
  }, []);

  // Client bootstrap — read localStorage + Network Information API after mount (no SSR access).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot hydration reads */
    setHydrated(true);
    setPreferenceState(readLiteModePreference());
    setNetworkMode(getNetworkMode());
    /* eslint-enable react-hooks/set-state-in-effect */

    const onConn = () => scheduleApplyNetwork(getNetworkMode());
    type ConnHint = {
      addEventListener?: (ev: string, fn: () => void) => void;
      removeEventListener?: (ev: string, fn: () => void) => void;
    };
    let conn: ConnHint | undefined;
    try {
      conn = (navigator as Navigator & { connection?: ConnHint }).connection;
      conn?.addEventListener?.("change", onConn);
    } catch {
      /* ignore */
    }

    const onStorage = () => setPreferenceState(readLiteModePreference());
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        conn?.removeEventListener?.("change", onConn);
      } catch {
        /* ignore */
      }
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [scheduleApplyNetwork]);

  const persistPreference = useCallback((next: LiteModePreference) => {
    setPreferenceState(next);
    try {
      if (next === "auto") localStorage.removeItem("lite_mode");
      else localStorage.setItem("lite_mode", next === "on" ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, []);

  const effectiveMode = preferenceToEffective(preference, networkMode);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- derived hint from refs + runtime clock */
    if (!hydrated || preference !== "auto") {
      setSuggestFullVersion(false);
      return;
    }
    if (suggestDismissed) {
      setSuggestFullVersion(false);
      return;
    }
    const onLitePath = pathname.startsWith("/lite");
    const networkRich = networkMode === "rich";
    const now = Date.now();
    setSuggestFullVersion(onLitePath && networkRich && now >= stickyLiteUntilRef.current);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hydrated, preference, pathname, networkMode, suggestDismissed, suggestTick]);

  useEffect(() => {
    if (!hydrated || preference !== "auto" || !pathname.startsWith("/lite")) return;
    const id = window.setInterval(() => setSuggestTick((t) => (t + 1) % 1_000_000), 2_000);
    return () => window.clearInterval(id);
  }, [hydrated, preference, pathname]);

  const dismissSuggest = useCallback(() => setSuggestDismissed(true), []);

  useEffect(() => {
    if (networkMode === "lite") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset dismiss when network forces lite again
      setSuggestDismissed(false);
    }
  }, [networkMode]);

  const toggleLiteMode = useCallback(() => {
    const next: LiteModePreference = preference === "on" ? "auto" : "on";
    persistPreference(next);
  }, [preference, persistPreference]);

  const value = useMemo<SyriaModeContextValue>(
    () => ({
      hydrated,
      preference,
      setPreference: persistPreference,
      effectiveMode,
      networkMode,
      suggestFullVersion,
      dismissSuggest,
      toggleLiteMode,
    }),
    [
      hydrated,
      preference,
      persistPreference,
      effectiveMode,
      networkMode,
      suggestFullVersion,
      dismissSuggest,
      toggleLiteMode,
    ],
  );

  return (
    <SyriaModeContext.Provider value={value}>
      <SyriaModeRouteSync
        hydrated={hydrated}
        effectiveMode={effectiveMode}
        preference={preference}
        pathname={pathname}
        routerReplace={router.replace}
        stickyLiteUntilRef={stickyLiteUntilRef}
        lastNavAtRef={lastNavAtRef}
      />
      {children}
    </SyriaModeContext.Provider>
  );
}

function SyriaModeRouteSync(props: {
  hydrated: boolean;
  effectiveMode: SyriaModeRouting;
  preference: LiteModePreference;
  pathname: string;
  routerReplace: (href: string, options?: { scroll?: boolean }) => void;
  stickyLiteUntilRef: MutableRefObject<number>;
  lastNavAtRef: MutableRefObject<number>;
}) {
  const { hydrated, effectiveMode, preference, pathname, routerReplace, stickyLiteUntilRef, lastNavAtRef } =
    props;

  useEffect(() => {
    if (!hydrated) return;

    /** Downgrade routing to `/lite/*` — never redirect back to rich on network heal (user gestures only). */
    if (effectiveMode !== "lite") return;

    const liteTarget = mapSyriaRichPathToLite(pathname);
    if (!liteTarget || liteTarget === pathname) return;

    const now = Date.now();
    /** Debounced auto downgrade only — explicit "Always lite" skips wait. */
    if (preference === "auto" && now - lastNavAtRef.current < AUTO_DEBOUNCE_MS) return;
    lastNavAtRef.current = now;
    stickyLiteUntilRef.current = now + STICKY_LITE_MS;

    try {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      sessionStorage.setItem("syria_lite_restore_scroll_y", String(y));
      sessionStorage.setItem("syria_lite_src_path", pathname);
    } catch {
      /* ignore */
    }

    routerReplace(liteTarget, { scroll: false });
  }, [hydrated, effectiveMode, preference, pathname, routerReplace, stickyLiteUntilRef, lastNavAtRef]);

  return null;
}

export function useSyriaMode(): SyriaModeContextValue {
  const ctx = useContext(SyriaModeContext);
  if (!ctx) {
    throw new Error("useSyriaMode must be used within SyriaModeProvider");
  }
  return ctx;
}

/** Optional: components that may render outside provider (e.g. tests) — fall back to safe defaults. */
export function useSyriaModeOptional(): SyriaModeContextValue | null {
  return useContext(SyriaModeContext);
}

export function useSwitchSyriaToFullVersion() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { setPreference } = useSyriaMode();

  return useCallback(() => {
    setPreference("off");
    const rich = mapSyriaLitePathToRich(pathname);
    if (rich && rich !== pathname) {
      try {
        sessionStorage.removeItem("syria_lite_restore_scroll_y");
      } catch {
        /* ignore */
      }
      router.replace(rich, { scroll: false });
    }
    try {
      sessionStorage.removeItem("syria_lite_src_path");
    } catch {
      /* ignore */
    }
  }, [pathname, router, setPreference]);
}
