import { assignWorkspaceReviewer } from "@/lib/trustgraph/application/assignWorkspaceReviewer";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { requireWorkspaceAdmin } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAdmin";
import {
  workspaceAssignmentSchema,
  workspaceIdParamsSchema,
} from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphEnabled, isTrustGraphEnterpriseWorkspacesEnabled } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return trustgraphJsonError("Enterprise workspaces disabled", 503);
  }

  const raw = await context.params;
  const parsedParams = workspaceIdParamsSchema.safeParse(raw);
  if (!parsedParams.success) return trustgraphJsonError("Invalid workspace", 400, parsedParams.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;

  const access = await requireWorkspaceAdmin(parsedParams.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return trustgraphJsonError("Invalid JSON", 400);
  }
  const parsed = workspaceAssignmentSchema.safeParse(body);
  if (!parsed.success) return trustgraphJsonError("Invalid body", 400, parsed.error.flatten());

  const result = await assignWorkspaceReviewer({
    workspaceId: parsedParams.data.workspaceId,
    caseId: parsed.data.caseId,
    assignedTo: parsed.data.assignedTo,
    assignedBy: session.userId,
    priority: parsed.data.priority,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
  });

  if ("skipped" in result && result.skipped) {
    return trustgraphJsonError("Assignment unavailable", 503);
  }

  return trustgraphJsonOk({ ok: true });
}
