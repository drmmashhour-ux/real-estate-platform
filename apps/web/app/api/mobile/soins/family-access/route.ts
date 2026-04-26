import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { resolveViewerForResident } from "@/modules/soins/soins-access.service";
import {
  revokeFamilyAccess,
  upsertFamilyAccess,
} from "@/modules/soins/soins-family.service";

import { jsonError, readJson } from "../_http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const residentId = url.searchParams.get("residentId");
  if (!residentId) return jsonError(400, "residentId query required");

  const gate = await resolveViewerForResident(auth, residentId);
  if (!gate) return jsonError(403, "Forbidden");

  const rows = await prisma.familyAccess.findMany({
    where: { residentId },
    include: {
      familyUser: { select: { id: true, email: true, name: true, phone: true } },
    },
    orderBy: { id: "asc" },
  });

  return Response.json({ familyAccess: rows });
}

export async function POST(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const body = await readJson<{
    residentId: string;
    familyUserId: string;
    canViewCamera?: boolean;
    canChat?: boolean;
    canReceiveAlerts?: boolean;
  }>(request);

  if (!body?.residentId || !body.familyUserId) {
    return jsonError(400, "residentId and familyUserId required");
  }

  const res = await upsertFamilyAccess({
    actingUser: auth,
    residentId: body.residentId,
    familyUserId: body.familyUserId,
    canViewCamera: body.canViewCamera,
    canChat: body.canChat,
    canReceiveAlerts: body.canReceiveAlerts,
  });

  if (!res.ok) return jsonError(res.error === "Forbidden" ? 403 : 400, res.error);

  const rows = await prisma.familyAccess.findMany({
    where: { residentId: body.residentId },
    include: {
      familyUser: { select: { id: true, email: true, name: true } },
    },
  });

  return Response.json({ ok: true, familyAccess: rows });
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const residentId = url.searchParams.get("residentId");
  const familyUserId = url.searchParams.get("familyUserId");
  if (!residentId || !familyUserId) {
    return jsonError(400, "residentId and familyUserId query params required");
  }

  const res = await revokeFamilyAccess(residentId, familyUserId, auth);
  if (!res.ok) return jsonError(res.error === "Forbidden" ? 403 : 400, res.error);

  return Response.json({ ok: true });
}
