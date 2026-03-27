import { extractionJobHealthSummary } from "@/lib/trustgraph/infrastructure/services/extractionAnalyticsService";
import { antifraudGraphSummary } from "@/lib/trustgraph/infrastructure/services/antifraudAnalyticsService";
import { geospatialMismatchSummary } from "@/lib/trustgraph/infrastructure/services/geospatialAnalyticsService";
import { mediaClassificationHealthSummary } from "@/lib/trustgraph/infrastructure/services/mediaAnalyticsService";

export async function buildTrustgraphInvestigationDashboard() {
  const [extraction, geo, media, fraud] = await Promise.all([
    extractionJobHealthSummary(),
    geospatialMismatchSummary(),
    mediaClassificationHealthSummary(),
    antifraudGraphSummary(),
  ]);
  return { extraction, geospatial: geo, media, antifraud: fraud };
}
