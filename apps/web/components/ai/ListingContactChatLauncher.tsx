"use client";

import { useState } from "react";
import { ClientCommunicationChat } from "@/components/ai/ClientCommunicationChat";
import type { ClientChatContext } from "@/lib/ai/client-communication-chat";

/**
 * Entry points: Contact button, listing page CTA, or open from parent.
 * Pass listing context (city e.g. Mirabel) for Québec-compliant copy.
 */
export function ListingContactChatLauncher({
  context,
  accent = "#10b981",
  label = "Contact",
  className = "",
}: {
  context: Partial<ClientChatContext>;
  accent?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-950 active:scale-[0.98] sm:py-2"
        }
        style={!className ? { background: accent } : undefined}
      >
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Chat with assistant"
        >
          <div className="relative w-full max-w-md pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-2 ml-auto block rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
            >
              Close
            </button>
            <ClientCommunicationChat context={context} accent={accent} defaultOpen />
          </div>
        </div>
      )}
    </>
  );
}
