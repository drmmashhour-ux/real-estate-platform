import { exportAuditPackageJson } from "@/lib/trustgraph/application/exportAuditPackage";
import { generateAuditPackage } from "@/lib/trustgraph/application/generateAuditPackage";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { requireWorkspaceAdmin } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAdmin";
import { workspaceIdParamsSchema } from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphAuditExportsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphAuditExportsEnabled()) {
    return trustgraphJsonError("Audit exports disabled", 503);
  }
  const raw = await context.params;
  const parsed = workspaceIdParamsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid workspace", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;
  const access = await requireWorkspaceAdmin(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  const fmt = new URL(request.url).searchParams.get("format") ?? "json";
  const result = await generateAuditPackage({
    workspaceId: parsed.data.workspaceId,
    createdBy: session.userId,
  });
  if ("skipped" in result && result.skipped) return trustgraphJsonError("Unavailable", 503);
  if (!("manifest" in result)) return trustgraphJsonError("Failed", 500);

  if (fmt === "json") {
    return new Response(exportAuditPackageJson(result.manifest), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return trustgraphJsonOk({
    packageId: result.packageId,
    packageHash: result.hash,
  });
}
