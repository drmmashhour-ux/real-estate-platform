import { getExternalListingTrust } from "@/lib/trustgraph/application/getExternalListingTrust";
import { trackExternalApiUsage } from "@/lib/trustgraph/application/integrations/billingIntegration";
import { prisma } from "@repo/db";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requirePartnerApiKey } from "@/lib/trustgraph/infrastructure/auth/requireApiKey";
import { z } from "zod";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePartnerApiKey(request);
  if (auth instanceof Response) return auth;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid id", 400, parsed.error.flatten());

  const scope = await prisma.trustgraphComplianceWorkspaceEntityLink.findFirst({
    where: {
      workspaceId: auth.workspaceId,
      entityType: "LISTING",
      entityId: parsed.data.id,
    },
  });
  if (!scope) return trustgraphJsonError("Not found", 404);

  const data = await getExternalListingTrust(parsed.data.id);
  if (!data) return trustgraphJsonError("Not found", 404);

  void trackExternalApiUsage({ workspaceId: auth.workspaceId }).catch(() => {});

  return trustgraphJsonOk({ trust: data });
}
