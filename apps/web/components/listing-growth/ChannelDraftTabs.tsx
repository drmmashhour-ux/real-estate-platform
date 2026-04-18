"use client";

import { useState, type ReactNode } from "react";

const CHANNELS = ["email", "social_post", "listing_page", "sms_short", "ad_copy", "internal_brief"] as const;

export function ChannelDraftTabs({ children }: { children: (channel: (typeof CHANNELS)[number]) => ReactNode }) {
  const [ch, setCh] = useState<(typeof CHANNELS)[number]>("email");
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {CHANNELS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCh(c)}
            className={`rounded px-2 py-1 text-[10px] uppercase ${
              ch === c ? "bg-amber-500/20 text-amber-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {children(ch)}
    </div>
  );
}
