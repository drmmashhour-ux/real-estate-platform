import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getInvestorDashboardData } from "@/modules/dashboard/services/investor-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getInvestorDashboardData(auth.id);
  return Response.json(data);
}
