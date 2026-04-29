"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "syria:pwa:install-banner-dismissed";

/** Chromium install prompt (not in all TS lib.dom builds). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function PwaInstallBanner() {
  const t = useTranslations("Offline");
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const install = async () => {
    const ev = deferredRef.current;
    if (!ev) return;
    await ev.prompt();
    deferredRef.current = null;
    setVisible(false);
  };

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-[90] border-t border-neutral-200 bg-[color:var(--darlink-surface,#fff)] px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] [padding-bottom:max(env(safe-area-inset-bottom),12px)] md:left-auto md:right-4 md:bottom-4 md:max-w-sm md:rounded-xl md:border md:shadow-lg"
    >
      <p className="text-sm font-medium text-neutral-900">{t("installBannerTitle")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
          onClick={() => void install()}
        >
          {t("installBannerCta")}
        </button>
        <button type="button" className="rounded-lg px-3 py-1.5 text-xs text-neutral-600" onClick={dismiss}>
          {t("installBannerDismiss")}
        </button>
      </div>
    </div>
  );
}
