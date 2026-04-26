import { getGrowthRecommendations } from "@/lib/services/growthEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getGrowthRecommendations());
}
