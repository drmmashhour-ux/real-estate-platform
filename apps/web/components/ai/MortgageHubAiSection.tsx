"use client";

import { HubAiDock } from "./HubAiDock";

export function MortgageHubAiSection() {
  return (
    <div className="mt-6">
      <HubAiDock hub="mortgage" legalFinancialSurface />
    </div>
  );
}
