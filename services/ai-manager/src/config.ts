const port = Number(process.env.AI_MANAGER_PORT) || 4002;
const basePath = process.env.AI_MANAGER_BASE_PATH || "/v1/ai-manager";

/** Optional service URLs for fetching data (when not provided in request body). */
export const config = {
  port,
  basePath,
  nodeEnv: process.env.NODE_ENV || "development",
  listingsServiceUrl: process.env.LISTINGS_SERVICE_URL || "",
  bookingsServiceUrl: process.env.BOOKINGS_SERVICE_URL || "",
  reviewsServiceUrl: process.env.REVIEWS_SERVICE_URL || "",
  paymentsServiceUrl: process.env.PAYMENTS_SERVICE_URL || "",
  cron: {
    listingQuality: process.env.CRON_LISTING_QUALITY || "0 6 * * *",   // 6 AM daily
    demandForecast: process.env.CRON_DEMAND_FORECAST || "0 7 * * *",  // 7 AM daily
    fraudMonitoring: process.env.CRON_FRAUD_MONITORING || "*/15 * * * *", // every 15 min
  },
};
