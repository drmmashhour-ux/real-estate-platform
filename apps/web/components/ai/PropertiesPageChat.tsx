"use client";

import { ClientCommunicationChat } from "@/components/ai/ClientCommunicationChat";

/** Floating assistant on marketing / listings pages (platform). */
export function PropertiesPageChat() {
  return (
    <ClientCommunicationChat
      context={{
        listingTitle: "our listings",
        city: "Mirabel",
        availabilityNote:
          "Status on the site is indicative only — a licensed broker in Québec must confirm availability before you rely on it.",
      }}
    />
  );
}
