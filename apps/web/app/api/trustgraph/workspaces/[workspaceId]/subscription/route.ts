import { cancelSubscription } from "@/lib/trustgraph/application/cancelSubscription";
import { createSubscription } from "@/lib/trustgraph/application/createSubscription";
import { getSubscriptionStatus } from "@/lib/trustgraph/application/getSubscriptionStatus";
import { updateSubscription } from "@/lib/trustgraph/application/updateSubscription";
import { ensureDefaultPlanIfMissing } from "@/lib/trustgraph/infrastructure/services/billingService";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { requireWorkspaceAdmin } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAdmin";
import { workspaceIdParamsSchema } from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphBillingEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postBodySchema = z.object({
  planId: z.string().optional(),
});

const patchBodySchema = z.object({
  subscriptionId: z.string().min(1),
  status: z.enum(["active", "trial", "paused", "canceled"]),
});

export async function GET(_request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) {
    return trustgraphJsonError("Billing disabled", 503);
  }
  const raw = await context.params;
  const parsed = workspaceIdParamsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid workspace", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;
  const access = await requireWorkspaceAdmin(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  const status = await getSubscriptionStatus(parsed.data.workspaceId);
  return trustgraphJsonOk({ subscription: status });
}

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) {
    return trustgraphJsonError("Billing disabled", 503);
  }
  const raw = await context.params;
  const parsed = workspaceIdParamsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid workspace", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;
  const access = await requireWorkspaceAdmin(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const b = postBodySchema.safeParse(body);
  const planId = b.success && b.data.planId ? b.data.planId : (await ensureDefaultPlanIfMissing());
  if (!planId) return trustgraphJsonError("No subscription plan configured", 503);

  const result = await createSubscription({
    workspaceId: parsed.data.workspaceId,
    planId,
    status: "trial",
  });
  if ("skipped" in result && result.skipped) return trustgraphJsonError("Unavailable", 503);
  return trustgraphJsonOk({ subscriptionId: "subscriptionId" in result ? result.subscriptionId : null });
}

export async function PATCH(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) {
    return trustgraphJsonError("Billing disabled", 503);
  }
  const raw = await context.params;
  const parsed = workspaceIdParamsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid workspace", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;
  const access = await requireWorkspaceAdmin(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return trustgraphJsonError("Invalid JSON", 400);
  }
  const b = patchBodySchema.safeParse(body);
  if (!b.success) return trustgraphJsonError("Invalid body", 400, b.error.flatten());

  if (b.data.status === "canceled") {
    const r = await cancelSubscription({ subscriptionId: b.data.subscriptionId, workspaceId: parsed.data.workspaceId });
    if ("skipped" in r && r.skipped) return trustgraphJsonError("Unavailable", 503);
  } else {
    const r = await updateSubscription({
      subscriptionId: b.data.subscriptionId,
      workspaceId: parsed.data.workspaceId,
      status: b.data.status,
    });
    if ("skipped" in r && r.skipped) return trustgraphJsonError("Unavailable", 503);
  }
  return trustgraphJsonOk({ ok: true });
}
