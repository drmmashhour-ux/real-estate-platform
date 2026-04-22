import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { runCeo } from "@/modules/ceo-ai/ceo-ai.service";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

export async function POST(req: NextRequest) {
  try {
    const cronOk = verifyCron(req);
    const mode =
      (req.nextUrl.searchParams.get("mode") as "daily" | "weekly" | "manual" | null) ?? "manual";

    if (!cronOk) {
      const userId = await getGuestId();
      if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      const me = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const effectiveMode = mode === "weekly" || mode === "daily" ? mode : "manual";
    const result = await runCeo(effectiveMode);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logError("[api.ceo-ai.run]", { error: e });
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** Cron-friendly alias */
export async function GET(req: NextRequest) {
  return POST(req);
}
