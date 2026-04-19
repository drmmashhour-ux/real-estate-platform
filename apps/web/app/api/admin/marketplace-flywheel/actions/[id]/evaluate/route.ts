import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { marketplaceFlywheelFlags } from "@/config/feature-flags";
import { evaluateFlywheelOutcome } from "@/modules/growth/flywheel-outcome.service";

export const dynamic = "force-dynamic";

/** POST — evaluate outcome (append snapshot row) — requires actions + outcomes flags */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!marketplaceFlywheelFlags.marketplaceFlywheelActionsV1 || !marketplaceFlywheelFlags.marketplaceFlywheelOutcomesV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const outcome = await evaluateFlywheelOutcome(id);
  if (!outcome) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ outcome });
}
