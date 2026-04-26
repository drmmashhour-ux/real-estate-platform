import { getRevenueOpportunities } from "@/lib/services/revenueAutopilot";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getRevenueOpportunities());
}
