import { AutopilotMode } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

const MODES: AutopilotMode[] = [
  AutopilotMode.OFF,
  AutopilotMode.ASSIST,
  AutopilotMode.SAFE_AUTOPILOT,
  AutopilotMode.FULL_AUTOPILOT_APPROVAL,
];

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const row =
    (await prisma.hostAutopilotSettings.findUnique({ where: { hostId: userId } })) ??
    (await prisma.hostAutopilotSettings.create({ data: { hostId: userId } }));

  return Response.json(row);
}

export async function PUT(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = typeof body.mode === "string" && MODES.includes(body.mode as AutopilotMode) ? (body.mode as AutopilotMode) : undefined;

  const data: Record<string, unknown> = {};
  if (mode) data.mode = mode;
  if (typeof body.autoPricing === "boolean") data.autoPricing = body.autoPricing;
  if (typeof body.autoPromotions === "boolean") data.autoPromotions = body.autoPromotions;
  if (typeof body.autoListingOptimization === "boolean") data.autoListingOptimization = body.autoListingOptimization;
  if (typeof body.autoMessaging === "boolean") data.autoMessaging = body.autoMessaging;
  if (typeof body.minPrice === "number") data.minPrice = body.minPrice;
  if (typeof body.maxPrice === "number") data.maxPrice = body.maxPrice;
  if (typeof body.maxDailyChangePct === "number") data.maxDailyChangePct = body.maxDailyChangePct;
  if (typeof body.requireApprovalForPricing === "boolean") data.requireApprovalForPricing = body.requireApprovalForPricing;
  if (typeof body.requireApprovalForPromotions === "boolean") data.requireApprovalForPromotions = body.requireApprovalForPromotions;
  if (typeof body.paused === "boolean") data.paused = body.paused;
  if (typeof body.pauseReason === "string") data.pauseReason = body.pauseReason;

  const row = await prisma.hostAutopilotSettings.upsert({
    where: { hostId: userId },
    create: { hostId: userId, ...data },
    update: data,
  });

  return Response.json(row);
}
