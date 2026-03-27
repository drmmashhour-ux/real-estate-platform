"use client";

import { useState } from "react";
import { track } from "@/lib/tracking";

type Props = {
  listingId: string;
  analyzeHref: string;
  contactHref: string;
};

async function postInteraction(listingId: string, interactionType: string) {
  await fetch("/api/daily-deals/interact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, interactionType }),
  }).catch(() => null);
}

export function DealQuickActions({ listingId, analyzeHref, contactHref }: Props) {
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-4">
      <a
        href={analyzeHref}
        onMouseDown={() => {
          track("daily_deal_card_clicked", { meta: { listingId } });
          void postInteraction(listingId, "analyzed");
        }}
        className="rounded-lg bg-[#C9A646] px-3 py-2 text-center text-xs font-semibold text-black hover:bg-[#e8c547]"
      >
        Analyze
      </a>
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          track("daily_deal_saved", { meta: { listingId } });
          await postInteraction(listingId, "saved");
          setSaving(false);
        }}
        className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/5"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <a
        href={contactHref}
        onMouseDown={() => {
          track("daily_deal_contact_clicked", { meta: { listingId } });
          void postInteraction(listingId, "contacted");
        }}
        className="rounded-lg border border-white/20 px-3 py-2 text-center text-xs text-white hover:bg-white/5"
      >
        Contact
      </a>
      <button
        type="button"
        onClick={() => {
          track("daily_deal_dismissed", { meta: { listingId } });
          void postInteraction(listingId, "dismissed");
          setDismissed(true);
        }}
        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5"
      >
        Dismiss
      </button>
    </div>
  );
}
