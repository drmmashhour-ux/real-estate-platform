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
import { usePathname as useNextPathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { appPathnameFromUrl } from "@/i18n/pathname";
import { getHadialinkNetworkMode } from "@/lib/hadia-lite/network";

const AUTO_DEBOUNCE_MS = 8_000;
const STICKY_LITE_MS = 10_000;

/** Namespace isolated from BNHub/global `lite_mode` keys. */
export const HADIALINK_LITE_STORAGE_KEY = "hadialink_lite_mode";

export type LiteModePreference = "auto" | "on" | "off";

export type HadialinkUiMode = "rich" | "lite";

function readPreference(): LiteModePreference {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(HADIALINK_LITE_STORAGE_KEY)?.toLowerCase();
    if (v === "true" || v === "1" || v === "on") return "on";
    if (v === "false" || v === "0" || v === "off") return "off";
  } catch {
    /* ignore */
  }
  return "auto";
}

export function preferenceToHadialinkMode(pref: LiteModePreference, nw: HadialinkUiMode): HadialinkUiMode {
  if (pref === "on") return "lite";
  if (pref === "off") return "rich";
  return nw;
}

/**
 * Minimal browse → `/lite/products` when ultra-lite enforced.
 * App-relative (no `/en`/`/sy` segments).
 */
export function mapHadialinkAppRouteToLite(appPath: string): string | null {
  if (appPath.startsWith("/lite/")) return null;

  const p = appPath === "/" ? "/" : appPath.endsWith("/") ? appPath.slice(0, -1) || "/" : appPath;

  if (
    p === "/" ||
    p.startsWith("/listings") ||
    p.startsWith("/feed") ||
    p.startsWith("/compare") ||
    p.startsWith("/legacy-home")
  ) {
    return "/lite/products";
  }
  return null;
}

export function mapHadialinkLiteRouteToRich(appPath: string): string {
  if (appPath.startsWith("/lite/products")) return "/feed";
  return "/feed";
}

type HadiaCtx = {
  hydrated: boolean;
  preference: LiteModePreference;
  setPreference: (p: LiteModePreference) => void;
  effectiveMode: HadialinkUiMode;
  networkMode: HadialinkUiMode;
  suggestFullVersion: boolean;
  dismissSuggest: () => void;
};

const HadialinkLiteModeCtx = createContext<HadiaCtx | null>(null);

export function HadialinkLiteModeRuntime({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathnameFull = useNextPathname() ?? "";

  const [hydrated, setHydrated] = useState(false);
  const [preference, setPrefState] = useState<LiteModePreference>("auto");
  const [networkMode, setNetworkMode] = useState<HadialinkUiMode>("rich");
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [suggestTick, setSuggestTick] = useState(0);
  const [suggestFullVersion, setSuggestFullVersion] = useState(false);

  const debounceConnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNavRef = useRef(0);
  const stickyLiteUntilRef = useRef(0);

  const persistPreference = useCallback((next: LiteModePreference) => {
    setPrefState(next);
    try {
      if (next === "auto") localStorage.removeItem(HADIALINK_LITE_STORAGE_KEY);
      else localStorage.setItem(HADIALINK_LITE_STORAGE_KEY, next === "on" ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, []);

  const scheduleNet = useCallback((next: HadialinkUiMode) => {
    if (debounceConnRef.current) clearTimeout(debounceConnRef.current);
    debounceConnRef.current = setTimeout(() => {
      debounceConnRef.current = null;
      setNetworkMode(next);
    }, AUTO_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- client bootstrap reads */
    setHydrated(true);
    setPrefState(readPreference());
    setNetworkMode(getHadialinkNetworkMode());
    /* eslint-enable react-hooks/set-state-in-effect */

    const onConn = () => scheduleNet(getHadialinkNetworkMode());
    type C = { addEventListener?: (e: string, fn: () => void) => void; removeEventListener?: (e: string, fn: () => void) => void };
    let conn: C | undefined;
    try {
      conn = (navigator as Navigator & { connection?: C }).connection;
      conn?.addEventListener?.("change", onConn);
    } catch {
      /* ignore */
    }

    return () => {
      try {
        conn?.removeEventListener?.("change", onConn);
      } catch {
        /* ignore */
      }
      if (debounceConnRef.current) clearTimeout(debounceConnRef.current);
    };
  }, [scheduleNet]);

  const effectiveMode = preferenceToHadialinkMode(preference, networkMode);

  const appPath = useMemo(() => appPathnameFromUrl(pathnameFull), [pathnameFull]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- lite-shell suggest uses wall clock + refs */
    if (!hydrated || preference !== "auto") {
      setSuggestFullVersion(false);
      return;
    }
    if (suggestDismissed) {
      setSuggestFullVersion(false);
      return;
    }
    const onLiteRoute = pathnameFull.includes("/lite/");
    const networkRich = networkMode === "rich";
    const now = Date.now();
    setSuggestFullVersion(onLiteRoute && networkRich && now >= stickyLiteUntilRef.current);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hydrated, preference, pathnameFull, networkMode, suggestDismissed, suggestTick]);

  useEffect(() => {
    if (!hydrated || preference !== "auto" || !pathnameFull.includes("/lite/")) return;
    const id = window.setInterval(() => setSuggestTick((t) => (t + 1) % 1_000_000), 2_000);
    return () => window.clearInterval(id);
  }, [hydrated, preference, pathnameFull]);

  const dismissSuggest = useCallback(() => setSuggestDismissed(true), []);

  useEffect(() => {
    if (networkMode === "lite") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset banner after poor network revisit
      setSuggestDismissed(false);
    }
  }, [networkMode]);

  const value = useMemo<HadiaCtx>(
    () => ({
      hydrated,
      preference,
      setPreference: persistPreference,
      effectiveMode,
      networkMode,
      suggestFullVersion,
      dismissSuggest,
    }),
    [hydrated, preference, persistPreference, effectiveMode, networkMode, suggestFullVersion, dismissSuggest],
  );

  return (
    <HadialinkLiteModeCtx.Provider value={value}>
      <HadiaRouteSync
        hydrated={hydrated}
        effectiveMode={effectiveMode}
        preference={preference}
        appPath={appPath}
        routerReplace={router.replace}
        lastNavRef={lastNavRef}
        stickyLiteUntilRef={stickyLiteUntilRef}
      />
      <HadialinkRibbon />
      {children}
    </HadialinkLiteModeCtx.Provider>
  );
}

function HadiaRouteSync(props: {
  hydrated: boolean;
  effectiveMode: HadialinkUiMode;
  preference: LiteModePreference;
  appPath: string;
  routerReplace: (href: string, opts?: { scroll?: boolean }) => void;
  lastNavRef: MutableRefObject<number>;
  stickyLiteUntilRef: MutableRefObject<number>;
}) {
  const {
    hydrated,
    effectiveMode,
    preference,
    appPath,
    routerReplace,
    lastNavRef,
    stickyLiteUntilRef,
  } = props;

  useEffect(() => {
    if (!hydrated) return;
    if (effectiveMode !== "lite") return;

    const target = mapHadialinkAppRouteToLite(appPath);
    if (!target || target === appPath) return;

    const now = Date.now();
    if (preference === "auto" && now - lastNavRef.current < AUTO_DEBOUNCE_MS) return;

    lastNavRef.current = now;
    stickyLiteUntilRef.current = Date.now() + STICKY_LITE_MS;

    try {
      sessionStorage.setItem("hadia_lite_src_app_path", appPath);
      sessionStorage.setItem(
        "hadia_lite_scroll_y",
        String(typeof window !== "undefined" ? window.scrollY : 0),
      );
    } catch {
      /* ignore */
    }

    routerReplace(target, { scroll: false });
  }, [hydrated, effectiveMode, preference, appPath, routerReplace, lastNavRef, stickyLiteUntilRef]);

  return null;
}

function HadialinkRibbon() {
  const ctx = useContext(HadialinkLiteModeCtx);
  const router = useRouter();
  const pathnameFull = useNextPathname() ?? "";
  const appPath = appPathnameFromUrl(pathnameFull);

  const onLite = pathnameFull.includes("/lite/");
  const show =
    !!ctx &&
    (ctx.effectiveMode === "lite" || onLite || (ctx.suggestFullVersion && ctx.preference === "auto"));

  const switchFull = () => {
    if (!ctx) return;
    ctx.setPreference("off");
    const richTarget = mapHadialinkLiteRouteToRich(appPath);
    router.replace(richTarget, { scroll: false });
    try {
      sessionStorage.removeItem("hadia_lite_scroll_y");
    } catch {
      /* ignore */
    }
  };

  if (!show || !ctx) return null;

  return (
    <div className={`mb-2 rounded border px-2 py-1 ${onLite ? "bg-amber-50 border-amber-400 text-amber-950" : "bg-neutral-100 border-neutral-300 text-neutral-900"}`}>

      {!onLite && ctx.effectiveMode === "lite" ? (
        <p className="text-[11px]">
          ⚡ Lite / low data —
          {" "}
          <button type="button" className="font-semibold text-sky-900 underline" onClick={() => router.replace("/lite/products")}>
            Open lite catalog
          </button>
        </p>
      ) : null}

      {onLite ? (
        <p className="text-[11px]">
          ⚡ Lite Mode (Low data)
          {" — "}
          <button type="button" className="font-semibold text-sky-900 underline" onClick={switchFull}>
            Switch to full version
          </button>
          {ctx.preference === "auto" && ctx.suggestFullVersion ? (
            <>
              {" "}
              ·
              {" "}
              <button type="button" className="text-neutral-600 underline" onClick={() => ctx.dismissSuggest()}>
                Stay in lite
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="mt-2 flex items-center gap-2 text-[10px]">
        <select
          className="rounded border px-2 py-0.5"
          aria-label="HadiaLink lite preference"
          value={ctx.preference}
          onChange={(e) => ctx.setPreference(e.target.value as LiteModePreference)}
        >
          <option value="auto">Auto</option>
          <option value="on">Always lite</option>
          <option value="off">Always rich</option>
        </select>
      </div>
    </div>
  );
}

export function useHadialinkLiteMode(): HadiaCtx {
  const ctx = useContext(HadialinkLiteModeCtx);
  if (!ctx) throw new Error("useHadialinkLiteMode requires HadialinkLiteModeRuntime");
  return ctx;
}
