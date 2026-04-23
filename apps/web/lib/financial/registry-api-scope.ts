import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/get-session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export type RegistryListBody = {
  ownerType: string;
  ownerId: string;
  reportingPeriodKey?: string | null;
  reported?: boolean | null;
  transactionType?: string | null;
};

export async function resolveFinancialRegistryScope(
  user: SessionUser,
  body: RegistryListBody,
): Promise<{ ownerType: string; ownerId: string } | NextResponse> {
  const ownerType = String(body.ownerType ?? "").trim();
  const ownerId = String(body.ownerId ?? "").trim();
  if (!ownerType || !ownerId) {
    return NextResponse.json({ error: "ownerType and ownerId required" }, { status: 400 });
  }

  const admin = await isPlatformAdmin(user.id);

  if (user.role === PlatformRole.BROKER) {
    if (ownerType !== "solo_broker" || ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return { ownerType: "solo_broker", ownerId: user.id };
  }

  if (admin) {
    if (ownerType === "agency" || ownerType === "solo_broker") {
      return { ownerType, ownerId };
    }
    return NextResponse.json({ error: "Invalid ownerType for admin" }, { status: 400 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
