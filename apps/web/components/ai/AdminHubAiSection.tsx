"use client";

import { HubAiDock } from "./HubAiDock";

export function AdminHubAiSection() {
  return (
    <div className="mt-6">
      <HubAiDock hub="admin" legalFinancialSurface />
    </div>
  );
}
