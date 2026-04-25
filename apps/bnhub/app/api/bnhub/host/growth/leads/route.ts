import { getGuestId } from "@/lib/auth/session";
import { listLeadsForHost } from "@/src/modules/bnhub-growth-engine/services/leadEngineService";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await listLeadsForHost(userId);
  return Response.json({ leads });
}
