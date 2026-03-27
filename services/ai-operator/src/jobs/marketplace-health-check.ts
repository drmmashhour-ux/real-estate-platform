import { checkMarketplaceHealth } from "../services/operator-service.js";

export async function runMarketplaceHealthCheck(): Promise<void> {
  checkMarketplaceHealth({
    periodDays: 7,
    bookingsTrend: "stable",
    cancellationsTrend: "stable",
    fraudAlertVolume: 0,
    disputeVolume: 0,
    listingActivationRate: 95,
    supportTicketSpike: false,
    paymentFailureSpike: false,
  });
  console.log("[marketplace-health-check] Completed.");
}
