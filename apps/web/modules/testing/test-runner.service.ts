import { createTunnelLogger } from "@/modules/testing/test-logger.service";
import { buildFinalReport, writeFinalReportJson } from "@/modules/testing/test-report.service";
import type { FinalValidationReport, TunnelTestResult } from "@/modules/testing/test-result.types";
import {
  tunnelAdminFlow,
  tunnelAiSystems,
  tunnelBnhubGuestBooking,
  tunnelBrokerDealFlow,
  tunnelEdgeCases,
  tunnelHostFlow,
  tunnelMobileFlow,
  tunnelPaymentStripe,
  tunnelSecurity,
} from "@/modules/testing/tunnels/lecipm-tunnels";

const CRITICAL_IDS = new Set([
  "bnhub-guest-booking",
  "payment-stripe",
  "broker-deal-flow",
  "security-access-control",
]);

const TUNNELS: {
  id: string;
  name: string;
  run: (logger: ReturnType<typeof createTunnelLogger>) => Promise<TunnelTestResult>;
}[] = [
  { id: "bnhub-guest-booking", name: "Guest → BNHub booking", run: tunnelBnhubGuestBooking },
  { id: "host-listing-payout", name: "Host → listing → metrics", run: tunnelHostFlow },
  { id: "broker-deal-flow", name: "Broker → deal (DB)", run: tunnelBrokerDealFlow },
  { id: "payment-stripe", name: "Stripe + webhook readiness", run: tunnelPaymentStripe },
  { id: "ai-roi-pricing", name: "ROI / pricing (deterministic)", run: tunnelAiSystems },
  { id: "admin-moderation", name: "Admin / platform events (DB)", run: tunnelAdminFlow },
  { id: "mobile-broker", name: "Mobile broker API gate (HTTP)", run: tunnelMobileFlow },
  { id: "security-access-control", name: "Security / readiness (HTTP)", run: tunnelSecurity },
  { id: "edge-cases", name: "Edge cases", run: tunnelEdgeCases },
];

export async function runLecipmValidationSuite(): Promise<FinalValidationReport> {
  const results: TunnelTestResult[] = [];

  for (const t of TUNNELS) {
    const critical = CRITICAL_IDS.has(t.id);
    const logger = createTunnelLogger(t.name);
    const result = await t.run(logger);
    results.push({ ...result, id: t.id, name: t.name, critical });
  }

  const report = buildFinalReport(results);
  writeFinalReportJson(report);
  return report;
}

export { TUNNELS, CRITICAL_IDS };
