import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { isLecipmPlatformAdminUser } from "@/modules/soins/soins-access.service";
import {
  deleteCareResidence,
  getCareResidence,
  updateCareResidence,
} from "@/modules/soins/soins-residence.service";
import { resolveViewerForResidence } from "@/modules/soins/soins-access.service";

import { jsonError, readJson } from "../../_http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const { id } = await ctx.params;
  const row = await getCareResidence(id);
  if (!row) return jsonError(404, "Not found");

  return Response.json({ residence: row });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const { id } = await ctx.params;
  const gate = await resolveViewerForResidence(auth, id);
  if (!gate.canMutate) return jsonError(403, "Forbidden");

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError(400, "Invalid JSON");

  const row = await updateCareResidence(id, {
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    ...(typeof body.description === "string" || body.description === null
      ? { description: body.description as string | null }
      : {}),
    ...(typeof body.city === "string" ? { city: body.city } : {}),
    ...(typeof body.address === "string" ? { address: body.address } : {}),
    ...(typeof body.basePrice === "number" ? { basePrice: body.basePrice } : {}),
    ...(typeof body.operatorId === "string" || body.operatorId === null
      ? { operatorId: body.operatorId as string | null }
      : {}),
  });

  return Response.json({ residence: row });
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");
  if (!(await isLecipmPlatformAdminUser(auth.id))) return jsonError(403, "Forbidden");

  const { id } = await ctx.params;
  await deleteCareResidence(id);
  return Response.json({ ok: true });
}
