"use client";

import { useState } from "react";
import type { PlatformRole } from "@prisma/client";
import { LecipmBrokerListingInbox } from "@/components/messaging/LecipmBrokerListingInbox";
import { MessagesPageClient } from "@/components/messaging/MessagesPageClient";

type Tab = "listings" | "crm";

export function BrokerMessagesTabs({
  viewerId,
  viewerRole,
  initialLecipmThreadId,
}: {
  viewerId: string;
  viewerRole?: PlatformRole;
  /** Deep link from in-app notification (`?lecipmThread=`). */
  initialLecipmThreadId?: string;
}) {
  const [tab, setTab] = useState<Tab>("listings");

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab("listings")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "listings" ? "bg-premium-gold text-black" : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          Listing inquiries
        </button>
        <button
          type="button"
          onClick={() => setTab("crm")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "crm" ? "bg-premium-gold text-black" : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          Conversations
        </button>
      </div>
      {tab === "listings" ? (
        <LecipmBrokerListingInbox initialThreadId={initialLecipmThreadId} />
      ) : (
        <MessagesPageClient viewerId={viewerId} viewerRole={viewerRole} />
      )}
    </div>
  );
}
