"use client";

import { useState } from "react";
import { PLATFORM_NAME } from "@/lib/brand/platform";

export function buildViralShareMessage(inviteUrl: string): string {
  return `Join me on ${PLATFORM_NAME} — homes, short stays, and investment tools in one place.\n${inviteUrl}`;
}

export function InviteFriendsShare({
  inviteUrl,
  className = "",
}: {
  inviteUrl: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = buildViralShareMessage(inviteUrl);

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/30 p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Invite friends</p>
      <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-bold text-black"
        >
          {copied ? "Copied" : "Copy message"}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ title: `Invite — ${PLATFORM_NAME}`, text: message, url: inviteUrl });
              } catch {
                /* dismissed */
              }
            } else {
              await navigator.clipboard.writeText(message);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }
          }}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white"
        >
          Share…
        </button>
      </div>
    </div>
  );
}
