import type { CareLevel } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import {
  canManageCareResidence,
  resolveViewerForResident,
} from "@/modules/soins/soins-access.service";
import {
  createResidentProfile,
  getResidentProfileById,
  getResidentProfileByUserId,
  updateResidentProfile,
} from "@/modules/soins/soins-resident.service";
import { estimateMonthlyForResident } from "@/modules/soins/soins-residence.service";

import { jsonError, readJson } from "../_http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const residentId = url.searchParams.get("residentId");

  if (residentId) {
    const gate = await resolveViewerForResident(auth, residentId);
    if (!gate) return jsonError(403, "Forbidden");

    const profile = await getResidentProfileById(residentId);
    if (!profile) return jsonError(404, "Not found");

    const pricing = await estimateMonthlyForResident(residentId);
    return Response.json({ profile, pricingEstimate: pricing });
  }

  const mine = await getResidentProfileByUserId(auth.id);
  if (!mine) return Response.json({ profile: null, pricingEstimate: null });
  const pricing = await estimateMonthlyForResident(mine.id);
  return Response.json({ profile: mine, pricingEstimate: pricing });
}

export async function POST(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const body = await readJson<{
    userId: string;
    residenceId: string;
    careLevel: CareLevel;
    foodPlanId?: string | null;
    healthNotes?: string | null;
    emergencyContact?: string | null;
  }>(request);

  if (!body?.userId || !body.residenceId || !body.careLevel) {
    return jsonError(400, "Missing userId, residenceId, or careLevel");
  }

  const can = await canManageCareResidence(auth.id, body.residenceId);
  if (!can) return jsonError(403, "Forbidden");

  const profile = await createResidentProfile(body);
  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const body = await readJson<{
    residentId: string;
    careLevel?: CareLevel;
    foodPlanId?: string | null;
    residenceId?: string;
    healthNotes?: string | null;
    emergencyContact?: string | null;
  }>(request);

  if (!body?.residentId) return jsonError(400, "residentId required");

  const gate = await resolveViewerForResident(auth, body.residentId);
  if (!gate) return jsonError(403, "Forbidden");

  const mine = await getResidentProfileByUserId(auth.id);
  const isSelf = mine?.id === body.residentId;
  const privileged = gate.role === "admin" || gate.role === "operator";

  if (!isSelf && !privileged) return jsonError(403, "Forbidden");

  const basePatch = {
    ...(body.healthNotes !== undefined ? { healthNotes: body.healthNotes } : {}),
    ...(body.emergencyContact !== undefined ? { emergencyContact: body.emergencyContact } : {}),
    ...(body.foodPlanId !== undefined ? { foodPlanId: body.foodPlanId } : {}),
  };

  const profile = await updateResidentProfile(
    body.residentId,
    privileged
      ? {
          ...basePatch,
          ...(body.careLevel ? { careLevel: body.careLevel } : {}),
          ...(body.residenceId ? { residenceId: body.residenceId } : {}),
        }
      : basePatch,
  );

  const pricing = await estimateMonthlyForResident(body.residentId);
  return Response.json({ profile, pricingEstimate: pricing });
}
