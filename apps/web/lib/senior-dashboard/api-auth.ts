import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { getGuestId } from "@/lib/auth/session";
import {
  canAccessAdminDashboard,
  canAccessManagementDashboard,
  canAccessResidenceDashboard,
  resolveSeniorHubAccess,
} from "./role";

type Ok = { ok: true; userId: string };
type Fail = { ok: false; response: NextResponse };

export async function requireDashboardSession(): Promise<Ok | Fail> {
  await ensureDynamicAuthRequest();
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, userId };
}

export async function requireResidenceDashboardApi(): Promise<
  | { ok: true; userId: string; access: Awaited<ReturnType<typeof resolveSeniorHubAccess>> }
  | Fail
> {
  const s = await requireDashboardSession();
  if (!s.ok) return s;
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const access = await resolveSeniorHubAccess(s.userId, user.role);
  if (!canAccessResidenceDashboard(access)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: s.userId, access };
}

export async function requireManagementDashboardApi(): Promise<
  | { ok: true; userId: string; access: Awaited<ReturnType<typeof resolveSeniorHubAccess>> }
  | Fail
> {
  const s = await requireDashboardSession();
  if (!s.ok) return s;
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const access = await resolveSeniorHubAccess(s.userId, user.role);
  if (!canAccessManagementDashboard(access)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: s.userId, access };
}

export async function requireAdminDashboardApi(): Promise<
  | { ok: true; userId: string }
  | Fail
> {
  const s = await requireDashboardSession();
  if (!s.ok) return s;
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const access = await resolveSeniorHubAccess(s.userId, user.role);
  if (!canAccessAdminDashboard(access)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: s.userId };
}
