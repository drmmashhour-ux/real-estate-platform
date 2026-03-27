import { getGuestId } from "@/lib/auth/session";
import { listChannels } from "@/src/modules/bnhub-marketing/services/distributionService";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const channels = await listChannels();
  return Response.json({ channels });
}
