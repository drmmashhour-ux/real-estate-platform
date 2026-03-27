"use client";

import { useCallback, useState } from "react";
import { buildShareAfterAnalysisCopy, SHARE_AFTER_ANALYSIS_LINE } from "@/lib/investment/share-deal-copy";
import { ShareDealButton } from "@/components/investment/ShareDealButton";
import { useToast } from "@/components/ui/ToastProvider";
import { track, TrackingEvent } from "@/lib/tracking";

type Props = {
  /** After save — public /deal/[id] link; else analyzer invite */
  dealId: string | null;
  referrerUserId?: string | null;
  shareVariant: "live" | "demo";
};

/**
 * Shown after a successful analysis run — copy link + optional native share when deal is saved.
 */
export function ShareAnalysisIncentiveCard({ dealId, referrerUserId, shareVariant }: Props) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const copyText = useCallback(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return buildShareAfterAnalysisCopy(dealId, origin, referrerUserId);
  }, [dealId, referrerUserId]);

  const onCopy = useCallback(async () => {
    setBusy(true);
    try {
      const text = copyText();
      await navigator.clipboard.writeText(text);
      showToast("Link copied — share anywhere", "success");
      track(TrackingEvent.INVESTMENT_SHARE_COPY_AFTER_ANALYSIS, {
        meta: {
          hasDealId: Boolean(dealId),
          mode: shareVariant,
          referrerUserId: referrerUserId ?? undefined,
        },
      });
    } catch {
      showToast("Could not copy — try again", "info");
    } finally {
      setBusy(false);
    }
  }, [copyText, dealId, referrerUserId, showToast, shareVariant]);

  return (
    <section
      className="rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/40 to-slate-950 p-5 sm:p-6"
      aria-labelledby="share-analysis-heading"
    >
      <h3 id="share-analysis-heading" className="text-lg font-bold text-white sm:text-xl">
        {SHARE_AFTER_ANALYSIS_LINE}
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        {dealId
          ? "Anyone with the link can view this public summary. Estimates only — not financial advice."
          : "Save a deal to your portfolio to get a shareable deal page — or share the analyzer link for now."}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => void onCopy()}
          disabled={busy}
          className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:opacity-60"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Copying…
            </span>
          ) : (
            "Copy link"
          )}
        </button>
        {dealId && shareVariant === "live" ? (
          <ShareDealButton dealId={dealId} referrerUserId={referrerUserId} shareVariant="live" />
        ) : null}
      </div>
    </section>
  );
}
