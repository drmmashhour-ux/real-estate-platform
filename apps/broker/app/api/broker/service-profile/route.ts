import { NextResponse } from "next/server";
import type { BrokerServiceProfileStored } from "@/modules/broker/profile/broker-profile.types";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerServiceProfileFlags } from "@/config/feature-flags";
import {
  getBrokerServiceProfile,
  upsertBrokerServiceProfile,
} from "@/modules/broker/profile/broker-service-profile.service";
import {
  parseBrokerServiceProfileStored,
  serializeStoredProfile,
} from "@/modules/broker/profile/broker-profile-payload";

export const dynamic = "force-dynamic";

function sanitizeBrokerWrites(base: BrokerServiceProfileStored, incoming: BrokerServiceProfileStored): BrokerServiceProfileStored {
  const specializations = incoming.specializations.map((s) => ({
    ...s,
    confidenceSource:
      s.confidenceSource === "admin_verified" ? ("self_declared" as const) : s.confidenceSource,
  }));
  return parseBrokerServiceProfileStored(
    serializeStoredProfile({
      ...incoming,
      specializations,
      adminVerifiedAt: base.adminVerifiedAt,
    }),
  );
}

export async function GET() {
  if (!brokerServiceProfileFlags.brokerServiceProfileV1 && !brokerServiceProfileFlags.brokerServiceProfilePanelV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await getBrokerServiceProfile(userId);
  if (!profile) return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });

  return NextResponse.json({
    profile,
    disclaimer:
      "Explicit declarations only — routing treats these as capped hints; incomplete profiles stay eligible with neutral fallback.",
  });
}

export async function PATCH(request: Request) {
  if (!brokerServiceProfileFlags.brokerServiceProfileV1 && !brokerServiceProfileFlags.brokerServiceProfilePanelV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const row = await prisma.brokerServiceProfile.findUnique({ where: { brokerId: userId } });
  const base = parseBrokerServiceProfileStored(row?.payload ?? null);

  const patch = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  if (!patch) return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });

  const merged = parseBrokerServiceProfileStored({
    ...serializeStoredProfile(base),
    ...patch,
  });

  const sanitized = sanitizeBrokerWrites(base, merged);
  const saved = await upsertBrokerServiceProfile(userId, sanitized);
  if (!saved) return NextResponse.json({ error: "Unable to save" }, { status: 500 });

  return NextResponse.json({ ok: true, profile: saved });
}
