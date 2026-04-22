import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { resolveViewerForResident } from "@/modules/soins/soins-access.service";
import { assertFamilyPermission } from "@/modules/soins/soins-family.service";
import { getAuthorizedStreamPayload } from "@/modules/soins/soins-camera.service";

import { jsonError } from "../_http";

export const dynamic = "force-dynamic";

async function assertCamera(auth: NonNullable<Awaited<ReturnType<typeof getMobileAuthUser>>>, residentId: string) {
  const gate = await resolveViewerForResident(auth, residentId);
  if (!gate) return false;
  if (gate.role === "admin" || gate.role === "operator") return true;
  if (gate.role === "family") {
    return assertFamilyPermission(auth, residentId, "camera");
  }
  return false;
}

/** Returns stream metadata when authorized — swap `streamUrl` for signed URLs in production. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const residentId = url.searchParams.get("residentId");
  const streamId = url.searchParams.get("streamId") ?? undefined;

  if (!residentId) return jsonError(400, "residentId query required");

  const ok = await assertCamera(auth, residentId);
  if (!ok) return jsonError(403, "Forbidden");

  const payload = await getAuthorizedStreamPayload({ residentId, streamId });
  if (!payload) return jsonError(404, "No active stream");

  return Response.json({
    stream: payload,
    warning:
      "Replace streamUrl with vendor-signed URLs before production hardening.",
  });
}
