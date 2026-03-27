import { loadWorkspacePortfolioAnalytics } from "@/lib/trustgraph/application/integrations/portfolioAnalyticsIntegration";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { requireWorkspaceReviewer } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceReviewer";
import {
  portfolioAnalyticsQuerySchema,
  workspaceIdParamsSchema,
} from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphEnabled, isTrustGraphPortfolioAnalyticsEnabled } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphPortfolioAnalyticsEnabled()) {
    return trustgraphJsonError("Portfolio analytics disabled", 503);
  }

  const raw = await context.params;
  const parsed = workspaceIdParamsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid workspace", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;

  const access = await requireWorkspaceReviewer(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  const sp = Object.fromEntries(new URL(request.url).searchParams.entries());
  const q = portfolioAnalyticsQuerySchema.safeParse(sp);
  const filter = q.success ? q.data : {};

  const analytics = await loadWorkspacePortfolioAnalytics(parsed.data.workspaceId, {
    entityType: filter.entityType,
    trustLevel: filter.trustLevel,
    readinessLevel: filter.readinessLevel,
    from: filter.from ? new Date(filter.from) : undefined,
    to: filter.to ? new Date(filter.to) : undefined,
  });

  const safe = {
    totalListings: analytics.totalListings,
    verifiedHighTrustPercent: analytics.verifiedHighTrustPercent,
    incompleteDeclarationsPercent: analytics.incompleteDeclarationsPercent,
    criticalUnresolvedPercent: analytics.criticalUnresolvedPercent,
    mortgageReadinessDistribution: analytics.mortgageReadinessDistribution,
    avgHoursToVerification: analytics.avgHoursToVerification,
    slaBreachRatePercent: analytics.slaBreachRatePercent,
  };

  return trustgraphJsonOk({
    safe,
    ...(access.kind === "platform_admin" ? { admin: analytics } : {}),
  });
}
