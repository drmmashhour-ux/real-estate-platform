"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClientCommunicationChat } from "@/components/ai/ClientCommunicationChat";

function EmbedChatInner() {
  const sp = useSearchParams();
  const features = sp.get("features");
  return (
    <div className="min-h-screen p-3">
      <ClientCommunicationChat
        defaultOpen
        context={{
          listingTitle: sp.get("title") ?? undefined,
          city: sp.get("city") ?? "Mirabel",
          listingId: sp.get("listingId") ?? undefined,
          projectId: sp.get("projectId") ?? undefined,
          introducedByBrokerId: sp.get("brokerId") ?? undefined,
          availabilityNote: sp.get("availability") ?? undefined,
          features: features ? features.split("|").filter(Boolean) : undefined,
        }}
      />
    </div>
  );
}

export default function EmbedAiChatPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading chat…</div>}>
      <EmbedChatInner />
    </Suspense>
  );
}
