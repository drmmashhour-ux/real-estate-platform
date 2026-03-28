import { demandByEventType } from "@/src/modules/data/demandAnalytics";
import { leadVolumeTrend } from "@/src/modules/data/trends";

export async function handlePublicAnalyticsGET(searchParams: URLSearchParams) {
  const sinceDays = Math.min(Math.max(Number(searchParams.get("sinceDays") ?? 30) || 30, 1), 180);
  const [demand, leads] = await Promise.all([demandByEventType(sinceDays), leadVolumeTrend()]);
  return {
    sinceDays,
    demand,
    leadTrend: leads,
  };
}
