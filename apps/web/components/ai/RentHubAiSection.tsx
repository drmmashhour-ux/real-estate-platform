"use client";

import { HubAiDock } from "./HubAiDock";

/** Long-term rental / landlord–tenant AI entry (uses `hub="rent"` prompts). */
export function RentHubAiSection() {
  return (
    <div className="mt-6">
      <HubAiDock hub="rent" />
    </div>
  );
}
