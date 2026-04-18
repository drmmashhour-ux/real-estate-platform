import type { Metadata } from "next";
import { BrokersAcquisitionClient } from "@/components/admin/BrokersAcquisitionClient";

export const metadata: Metadata = {
  title: "Broker prospects (legacy DB)",
  robots: { index: false, follow: false },
};

/** Prisma-backed first-10 brokers list — separate from the V1 in-memory pipeline. */
export default function BrokerAcquisitionLegacyPage() {
  return <BrokersAcquisitionClient />;
}
