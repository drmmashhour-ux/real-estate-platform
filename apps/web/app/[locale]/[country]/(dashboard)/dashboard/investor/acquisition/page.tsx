"use client";

import { AcquisitionSimulatorClient } from "@/components/investor/AcquisitionSimulatorClient";

export default function AcquisitionSimulatorPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <AcquisitionSimulatorClient variant="dashboard" />
    </div>
  );
}
