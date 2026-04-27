"use client";

import { useCallback, useEffect, useState } from "react";

const COOKIE = "lecipm_demo=1; Path=/; Max-Age=86400; SameSite=Lax";
const COOKIE_OFF = "lecipm_demo=; Path=/; Max-Age=0; SameSite=Lax";

type Props = { showClientCookieToggle: boolean };

/**
 * Local preview: toggles the `lecipm_demo=1` cookie (requires `FEATURE_DEMO_MODE_CLIENT=1` in dev).
 * Production must use `FEATURE_DEMO_MODE` + `FEATURE_DEMO_MODE_PROD` — see admin copy.
 */
export function DemoModeAdminClient({ showClientCookieToggle }: Props) {
  const [on, setOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof document === "undefined") return;
    setOn(document.cookie.includes("lecipm_demo=1"));
  }, []);

  const setCookie = useCallback((active: boolean) => {
    document.cookie = active ? COOKIE : COOKIE_OFF;
    setOn(active);
    try {
      localStorage.setItem("lecipm_demo", active ? "1" : "0");
    } catch {
      // ignore
    }
    window.location.reload();
  }, []);

  if (!showClientCookieToggle) {
    return (
      <p className="text-sm text-zinc-500">
        Client cookie toggle is disabled. In development, set{" "}
        <code className="rounded bg-zinc-800 px-1">FEATURE_DEMO_MODE_CLIENT=1</code> in your env to use the on-page
        switch; otherwise set <code className="rounded bg-zinc-800 px-1">FEATURE_DEMO_MODE=1</code> for full-server demo
        mode.
      </p>
    );
  }

  if (!hydrated) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-zinc-300">Browser preview (cookie {on ? "on" : "off"})</span>
      <button
        type="button"
        onClick={() => setCookie(!on)}
        className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/30"
      >
        {on ? "Turn demo off" : "Turn demo on"}
      </button>
    </div>
  );
}
