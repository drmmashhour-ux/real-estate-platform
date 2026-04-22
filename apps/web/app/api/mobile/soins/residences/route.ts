import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { isLecipmPlatformAdminUser } from "@/modules/soins/soins-access.service";
import {
  createCareResidence,
  listCareResidences,
} from "@/modules/soins/soins-residence.service";

import { jsonError, readJson } from "../_http";

export const dynamic = "force-dynamic";

/** Browse catalog + admin create */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? undefined;

  const rows = await listCareResidences({ city });
  return Response.json({ residences: rows });
}

export async function POST(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");
  const canCreate = await isLecipmPlatformAdminUser(auth.id);
  if (!canCreate) return jsonError(403, "Forbidden");

  const body = await readJson<Parameters<typeof createCareResidence>[0]>(request);
  if (!body?.title || !body.city || !body.address || body.basePrice == null) {
    return jsonError(400, "Missing required fields");
  }

  const row = await createCareResidence(body);
  return Response.json({ residence: row });
}
