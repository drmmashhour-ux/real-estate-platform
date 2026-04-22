"use client";

import { SoinsAccessibilityToggle } from "@/components/soins/SoinsAccessibilityToggle";

export function SoinsDashboardA11yBar() {
  return (
    <div className="flex justify-end px-4 py-2">
      <SoinsAccessibilityToggle />
    </div>
  );
}
