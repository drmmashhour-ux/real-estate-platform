"use client";

import { useTranslations } from "next-intl";

export function SyriaOfflineChrome(props: { online: boolean; pendingQueueHint: boolean }) {
  const { online, pendingQueueHint } = props;
  const t = useTranslations("Offline");

  if (online && !pendingQueueHint) {
    return null;
  }

  return (
    <div
      className="fixed bottom-16 left-4 right-4 z-[110] mx-auto flex max-w-3xl flex-col gap-1 rounded-2xl border border-amber-200/70 bg-amber-50/95 px-4 py-2.5 text-sm text-amber-950 shadow-[0_12px_30px_-8px_rgba(0,0,0,.15)] backdrop-blur sm:bottom-20 md:right-auto"
      role="status"
      aria-live="polite"
    >
      {!online ? (
        <div className="flex items-start gap-2 [dir=rtl]:flex-row-reverse [dir=rtl]:text-right">
          <span className="shrink-0" aria-hidden>
            ⚠️
          </span>
          <div>
            <p className="font-semibold">{t("offlineBannerTitle")}</p>
            <p className="mt-0.5 text-[13px] text-amber-900/95">{t("offlineBannerSubtitle")}</p>
          </div>
        </div>
      ) : null}
      {online && pendingQueueHint ? (
        <p className="text-[13px] text-amber-900/95 [dir=rtl]:text-right">{t("pendingChanges")}</p>
      ) : null}
      {!online ? (
        <p className="text-[13px] text-amber-900/85 [dir=rtl]:text-right">{t("limitationsBody")}</p>
      ) : pendingQueueHint ? (
        <p className="text-[13px] text-amber-900/85 [dir=rtl]:text-right">{t("limitationsBodyShort")}</p>
      ) : null}
    </div>
  );
}
