import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { loadBnhubLaunchDashboardRows } from "@/lib/bnhub/bnhub-launch-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await loadBnhubLaunchDashboardRows();
  return Response.json(data);
}
