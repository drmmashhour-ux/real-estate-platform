const port = Number(process.env.AI_OPERATOR_PORT) || 4003;
const basePath = process.env.AI_OPERATOR_BASE_PATH || "/api/ai-operator";

export const config = {
  port,
  basePath,
  nodeEnv: process.env.NODE_ENV || "development",
  listingsServiceUrl: process.env.LISTINGS_SERVICE_URL || "",
  bookingsServiceUrl: process.env.BOOKINGS_SERVICE_URL || "",
  paymentsServiceUrl: process.env.PAYMENTS_SERVICE_URL || "",
  messagingServiceUrl: process.env.MESSAGING_SERVICE_URL || "",
  reviewsServiceUrl: process.env.REVIEWS_SERVICE_URL || "",
  cron: {
    listingScan: process.env.CRON_LISTING_SCAN || "0 6 * * *",
    pricingRefresh: process.env.CRON_PRICING_REFRESH || "0 7 * * *",
    fraudScan: process.env.CRON_FRAUD_SCAN || "0 * * * *",
    demandForecast: process.env.CRON_DEMAND_FORECAST || "0 8 * * *",
    hostPerformance: process.env.CRON_HOST_PERFORMANCE || "0 9 * * *",
    supportTriage: process.env.CRON_SUPPORT_TRIAGE || "*/30 * * * *",
    marketplaceHealth: process.env.CRON_MARKETPLACE_HEALTH || "0 */6 * * *",
  },
};
