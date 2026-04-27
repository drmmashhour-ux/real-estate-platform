import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { loadAbAggregateRowsFromGrowth } from "@/lib/ab/growth-aggregate";
import { pickWinner } from "@/lib/ab/winner";

export const dynamic = "force-dynamic";

async function authorize(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  const userId = await getGuestId();
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === PlatformRole.ADMIN;
}

export async function GET(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeWinner = req.nextUrl.searchParams.get("winner") === "1";
  const daysRaw = req.nextUrl.searchParams.get("days");
  const days = daysRaw ? Math.max(1, Math.min(180, Math.floor(Number(daysRaw) || 7))) : 7;

  const rows = await loadAbAggregateRowsFromGrowth(days);

  if (!includeWinner) {
    return NextResponse.json({ rows });
  }

  const byExperiment = new Map<string, typeof rows>();
  for (const row of rows) {
    const ex = row.experiment ?? "";
    if (!byExperiment.has(ex)) byExperiment.set(ex, []);
    byExperiment.get(ex)!.push(row);
  }

  const winnerByExperiment: Record<string, ReturnType<typeof pickWinner>> = {};
  for (const [exp, list] of byExperiment) {
    winnerByExperiment[exp] = pickWinner(
      list.map((r) => ({
        experiment: r.experiment,
        variant: r.variant,
        exposures: r.exposures,
        conversions: r.conversions,
      }))
    );
  }

  return NextResponse.json({ rows, winnerByExperiment });
}
