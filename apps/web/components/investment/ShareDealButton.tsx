"use client";

import { useCallback, useState } from "react";
import { buildShareDealMessage } from "@/lib/investment/share-deal-copy";
import { track, TrackingEvent } from "@/lib/tracking";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  dealId: string;
  /** Logged-in sharer — adds ?ru= for referral attribution */
  referrerUserId?: string | null;
  /** demo = local-only deals — no public URL */
  shareVariant?: "live" | "demo";
  className?: string;
  size?: "sm" | "md";
};

export function ShareDealButton({
  dealId,
  referrerUserId,
  shareVariant = "live",
  className = "",
  size = "md",
}: Props) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const disabled = shareVariant === "demo";

  const onShare = useCallback(async () => {
    if (disabled) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = buildShareDealMessage(dealId, origin, referrerUserId ?? undefined);
    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ text, title: "LECIPM — deal analysis" });
        track(TrackingEvent.SHARE_DEAL_CLICKED, { meta: { dealId, mode: "native", referrerUserId } });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast("Link copied — paste anywhere to share", "success");
        track(TrackingEvent.SHARE_DEAL_CLICKED, { meta: { dealId, mode: "clipboard", referrerUserId } });
      } else {
        window.prompt("Copy to share:", text);
        track(TrackingEvent.SHARE_DEAL_CLICKED, { meta: { dealId, mode: "prompt", referrerUserId } });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard", "success");
      } catch {
        showToast("Could not copy — try again", "info");
      }
    } finally {
      setBusy(false);
    }
  }, [dealId, disabled, showToast, referrerUserId]);

  const sizeCls = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      disabled={disabled || busy}
      title={
        disabled
          ? "Sign in and save deals to get a shareable link"
          : "Copy a message with your public deal link"
      }
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizeCls} ${
        disabled
          ? "border-white/10 bg-white/5 text-slate-500"
          : "border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
      } ${className}`}
    >
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
      ) : null}
      Share this deal
    </button>
  );
}
