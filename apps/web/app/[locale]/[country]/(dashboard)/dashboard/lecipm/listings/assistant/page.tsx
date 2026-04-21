import type { Metadata } from "next";

import { ListingAssistant } from "@/components";

export const metadata: Metadata = {
  title: "Listing Assistant · LECIPM Console",
};

export default function LecipmConsoleListingAssistantPage() {
  return (
    <div>
      <ListingAssistant />
    </div>
  );
}
