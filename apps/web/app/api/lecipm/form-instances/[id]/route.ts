import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { updateFormInstanceData } from "@/modules/form-instance/form-instance.service";

export const dynamic = "force-dynamic";

type Params = { id: string };

/** GET /api/lecipm/form-instances/[id] — LECIPM OACIQ form instance (distinct from legacy /api/forms/[id] submissions). */
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  if (!lecipmOaciqFlags.oaciqFormsEngineV1) {
    return Response.json({ error: "OACIQ forms engine disabled" }, { status: 403 });
  }
  const { id } = await params;
  const row = await prisma.lecipmFormInstance.findUnique({
    where: { id },
    include: { template: true, versions: { orderBy: { version: "desc" }, take: 5 } },
  });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const auth = await authenticateBrokerDealRoute(row.dealId);
  if (!auth.ok) return auth.response;

  return Response.json(row);
}

/** PATCH /api/lecipm/form-instances/[id] */
export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  if (!lecipmOaciqFlags.oaciqFormsEngineV1) {
    return Response.json({ error: "OACIQ forms engine disabled" }, { status: 403 });
  }
  const { id } = await params;
  const row = await prisma.lecipmFormInstance.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const auth = await authenticateBrokerDealRoute(row.dealId);
  if (!auth.ok) return auth.response;

  let body: { data?: Record<string, unknown>; status?: import("@prisma/client").LecipmFormInstanceStatus };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.data) {
    return Response.json({ error: "data required" }, { status: 400 });
  }

  const updated = await updateFormInstanceData({
    id,
    data: body.data,
    status: body.status,
    userId: auth.userId,
  });
  return Response.json(updated);
}
