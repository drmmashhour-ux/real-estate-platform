/**
 * AI Data Pipeline – collect platform data for AI models.
 * Run via: npm run pipeline (or tsx src/pipeline/run.ts)
 * In production, this would connect to the platform DB and aggregate:
 * - listings (count, fields for quality)
 * - bookings (frequency, cancellation rate)
 * - reviews (count, ratings)
 * - pricing history (from AiPricingRecommendation or listing history)
 * - search activity (if available)
 * Output: aggregated metrics (console or write to a store).
 * This service has no DB by default; the apps/web has Prisma. So we output a stub report.
 */
const run = async () => {
  const report = {
    runAt: new Date().toISOString(),
    source: "ai-service-pipeline",
    message: "AI data pipeline stub. Wire this to platform DB (e.g. Prisma in apps/web) to aggregate listings, bookings, reviews, pricing history, search activity.",
    suggestedMetrics: [
      "listings_per_region",
      "bookings_per_listing",
      "reviews_per_listing",
      "avg_night_price_by_region",
      "cancellation_rate",
      "search_volume_by_city",
    ],
  };
  console.log(JSON.stringify(report, null, 2));
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
