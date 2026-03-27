import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  jobPriceIndexUpdate,
  jobRentIndexUpdate,
  jobBnhubIndexUpdate,
  jobDemandUpdate,
  jobInvestmentScoring,
  jobMarketReports,
  runWeeklyAnalytics,
  runMonthlyInvestmentScoring,
} from "@/lib/market-intelligence";

/**
 * POST /api/admin/market/jobs/run
 * Body: { job: "price_index"|"rent_index"|"bnhub_index"|"demand"|"investment"|"reports"|"weekly"|"monthly_investment", period?: "YYYY-MM" }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const job = body.job as string;
    const period = body.period as string | undefined;

    const run = async () => {
      switch (job) {
        case "price_index":
          return jobPriceIndexUpdate(period);
        case "rent_index":
          return jobRentIndexUpdate(period);
        case "bnhub_index":
          return jobBnhubIndexUpdate(period);
        case "demand":
          return jobDemandUpdate(period);
        case "investment":
          return runMonthlyInvestmentScoring();
        case "reports":
          return jobMarketReports(period);
        case "weekly":
          return runWeeklyAnalytics(period);
        case "monthly_investment":
          return runMonthlyInvestmentScoring();
        default:
          throw new Error("job must be price_index, rent_index, bnhub_index, demand, investment, reports, weekly, or monthly_investment");
      }
    };

    const result = await run();
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Job failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
