import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { resolveViewerForResident } from "@/modules/soins/soins-access.service";
import { assertFamilyPermission } from "@/modules/soins/soins-family.service";
import { getConversation, sendMessage } from "@/modules/soins/soins-chat.service";

import { jsonError, readJson } from "../_http";

export const dynamic = "force-dynamic";

async function assertChatAccess(auth: NonNullable<Awaited<ReturnType<typeof getMobileAuthUser>>>, residentId: string) {
  const gate = await resolveViewerForResident(auth, residentId);
  if (!gate) return false;
  if (gate.role === "family") {
    return assertFamilyPermission(auth, residentId, "chat");
  }
  return true;
}

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const residentId = url.searchParams.get("residentId");
  if (!residentId) return jsonError(400, "residentId query required");

  const ok = await assertChatAccess(auth, residentId);
  if (!ok) return jsonError(403, "Forbidden");

  const messages = await getConversation(residentId);
  return Response.json({ messages });
}

export async function POST(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const body = await readJson<{ residentId: string; message: string }>(request);
  if (!body?.residentId || !body.message?.trim()) {
    return jsonError(400, "residentId and message required");
  }

  const ok = await assertChatAccess(auth, body.residentId);
  if (!ok) return jsonError(403, "Forbidden");

  const row = await sendMessage({
    residentId: body.residentId,
    senderId: auth.id,
    message: body.message,
  });

  return Response.json({ message: row });
}
