"use client";

import { useRouter } from "@/i18n/navigation";
import { useCallback, useState } from "react";

import { LECIPM_DASHBOARD_CONSOLE_STORAGE_KEY } from "@/lib/dashboard/lecipm-console-preference";
import { trackEvent } from "@/lib/tracking/events";

async function postPreference(preference: "classic" | "lecipm") {
  const res = await fetch("/api/dashboard/lecipm-console-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ preference }),
  });
  if (!res.ok) throw new Error("preference_failed");
  try {
    localStorage.setItem(LECIPM_DASHBOARD_CONSOLE_STORAGE_KEY, preference);
  } catch {
    /* ignore */
  }
}

/** Promote LECIPM OS from the classic `/dashboard` portfolio shell. */
export function LecipmConsolePromoteButton(props: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = useCallback(async () => {
    setBusy(true);
    try {
      await postPreference("lecipm");
      trackEvent("dashboard_console_toggle", { to: "lecipm", from: "classic" });
      const qs =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).toString() : "";
      const href = qs ? `/dashboard/lecipm?${qs}` : "/dashboard/lecipm";
      router.push(href);
    } catch {
      setBusy(false);
    }
  }, [router]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void go()}
      className={
        props.className ??
        "rounded-full border border-premium-gold/40 bg-black/50 px-4 py-2 text-sm font-medium text-premium-gold transition hover:border-premium-gold/70 hover:bg-premium-gold/10 disabled:opacity-50"
      }
    >
      {busy ? "Switching…" : "Switch to LECIPM OS"}
    </button>
  );
}

/** Return to classic portfolio `/dashboard` from the LECIPM console shell. */
export function LecipmConsoleBackToClassicButton(props: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = useCallback(async () => {
    setBusy(true);
    try {
      await postPreference("classic");
      trackEvent("dashboard_console_toggle", { to: "classic", from: "lecipm" });
      const qs =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).toString() : "";
      const href = qs ? `/dashboard?${qs}` : "/dashboard";
      router.push(href);
    } catch {
      setBusy(false);
    }
  }, [router]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void go()}
      className={
        props.className ??
        "rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white disabled:opacity-50"
      }
    >
      {busy ? "Switching…" : "Back to Classic"}
    </button>
  );
}
