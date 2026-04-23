import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  listLearningPatternsForDashboard,
  type LearningPatternSortField,
} from "@/modules/learning/learning-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const sortBy = (url.searchParams.get("sortBy") ?? "confidence") as LearningPatternSortField;
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const minSampleSize = Number(url.searchParams.get("minSampleSize") ?? "0") || 0;
  const take = Number(url.searchParams.get("take") ?? "200") || 200;

  try {
    const patterns = await listLearningPatternsForDashboard({
      sortBy,
      sortDir,
      minSampleSize,
      take,
    });
    return NextResponse.json({
      patterns,
      explainability: {
        dataSources: ["DealOutcome aggregates → learning_patterns"],
        advisoryOnly: true,
      },
    });
  } catch (e) {
    console.error("[autonomous-brain/patterns]", e);
    return NextResponse.json({ error: "patterns_failed" }, { status: 500 });
  }
}
