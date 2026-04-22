import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getSellerDashboardData } from "@/modules/dashboard/services/seller-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getSellerDashboardData(auth.id);
  return Response.json(data);
}
