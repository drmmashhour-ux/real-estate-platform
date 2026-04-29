"use client";

import { useTranslations } from "next-intl";
import { syncCircuitPausedUntil } from "@/lib/sybnb/sync-engine";
import { useSybnbSync } from "@/components/sybnb/SybnbSyncProvider";

export function SybnbSyncRibbon() {
  const { phase, pendingCount, failedCount, retryFailedSync } = useSybnbSync();
  const t = useTranslations("Offline");

  const paused =
    typeof window !== "undefined" && Date.now() < syncCircuitPausedUntil();

  if (
    pendingCount === 0 &&
    failedCount === 0 &&
    (phase === "idle" || phase === "synced") &&
    !paused
  ) {
    return null;
  }

  let label: string;
  let emoji: string;

  if (paused || phase === "paused") {
    label = t("syncRibbonPaused");
    emoji = "⚠️";
  } else if (failedCount > 0) {
    label = t("syncRibbonFailed");
    emoji = "❌";
  } else if (phase === "syncing") {
    label = t("syncRibbonSyncing");
    emoji = "🔄";
  } else if (pendingCount > 0 || phase === "pending") {
    label = t("syncRibbonPending");
    emoji = "⏳";
  } else if (phase === "synced") {
    label = t("syncRibbonSynced");
    emoji = "✔";
  } else if (phase === "failed") {
    label = t("syncRibbonFailed");
    emoji = "❌";
  } else {
    label = t("syncRibbonPending");
    emoji = "⏳";
  }

  const countShown = pendingCount + failedCount;

  return (
    <div
      role="status"
      className="sticky top-0 z-[85] border-b border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-center text-[11px] font-medium text-amber-950 backdrop-blur-sm [dir=rtl]:text-right"
    >
      <span aria-hidden="true">{emoji}</span> {label}
      {countShown > 0 ? ` (${countShown})` : ""}
      {failedCount > 0 ? (
        <button
          type="button"
          onClick={() => retryFailedSync()}
          className="ms-2 rounded border border-amber-400/80 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-100"
        >
          {t("syncRibbonRetry")}
        </button>
      ) : null}
    </div>
  );
}
