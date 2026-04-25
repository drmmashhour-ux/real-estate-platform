import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  addFirstQuebecBroker,
  getFirstQuebecSummary,
  listFirstQuebecBrokers,
  patchFirstQuebecBroker,
} from "@/modules/brokers/first-ten-quebec-brokers.service";
import type { FirstQuebecCity, FirstQuebecResponseLevel, FirstQuebecSource, FirstQuebecStage } from "@/modules/brokers/first-ten-quebec.types";

export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function GET() {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = listFirstQuebecBrokers();
  const summary = getFirstQuebecSummary();
  return json({ rows, summary });
}

export async function POST(request: Request) {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "mark_contacted" && typeof body.id === "string") {
    const r = patchFirstQuebecBroker(body.id, {
      stage: "contacted",
      lastContactAt: new Date().toISOString(),
    });
    if (!r.ok) return json({ error: r.error }, { status: 400 });
    return json({ row: r.row, summary: getFirstQuebecSummary() });
  }

  if (body.action === "schedule_followup" && typeof body.id === "string") {
    const days = typeof body.days === "number" && body.days > 0 ? body.days : 2;
    const d = new Date();
    d.setDate(d.getDate() + days);
    const r = patchFirstQuebecBroker(body.id, { nextFollowUpAt: d.toISOString() });
    if (!r.ok) return json({ error: r.error }, { status: 400 });
    return json({ row: r.row, summary: getFirstQuebecSummary() });
  }

  const city = body.city;
  const source = body.source;
  if (city !== "montreal" && city !== "laval") return json({ error: "INVALID_CITY" }, { status: 400 });
  if (source !== "facebook" && source !== "instagram" && source !== "google") {
    return json({ error: "INVALID_SOURCE" }, { status: 400 });
  }

  const r = addFirstQuebecBroker({
    name: String(body.name ?? ""),
    phone: String(body.phone ?? ""),
    email: String(body.email ?? ""),
    city: city as FirstQuebecCity,
    source: source as FirstQuebecSource,
    targetIndependent: body.targetIndependent === true,
    targetUnderFiveYears: body.targetUnderFiveYears === true,
    targetSocialActive: body.targetSocialActive === true,
    targetSmallTeam: body.targetSmallTeam === true,
    activityScore: Number(body.activityScore) || 3,
    responseLevel: (body.responseLevel as FirstQuebecResponseLevel) ?? "none",
    notes: body.notes != null ? String(body.notes) : undefined,
  });
  if (!r.ok) return json({ error: r.error }, { status: 400 });
  return json({ row: r.row, summary: getFirstQuebecSummary() });
}

export async function PATCH(request: Request) {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return json({ error: "id required" }, { status: 400 });

  const patch: Parameters<typeof patchFirstQuebecBroker>[1] = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.phone === "string") patch.phone = body.phone;
  if (typeof body.email === "string") patch.email = body.email;
  if (body.city === "montreal" || body.city === "laval") patch.city = body.city;
  if (body.source === "facebook" || body.source === "instagram" || body.source === "google") {
    patch.source = body.source;
  }
  if (typeof body.targetIndependent === "boolean") patch.targetIndependent = body.targetIndependent;
  if (typeof body.targetUnderFiveYears === "boolean") patch.targetUnderFiveYears = body.targetUnderFiveYears;
  if (typeof body.targetSocialActive === "boolean") patch.targetSocialActive = body.targetSocialActive;
  if (typeof body.targetSmallTeam === "boolean") patch.targetSmallTeam = body.targetSmallTeam;
  if (body.activityScore !== undefined) patch.activityScore = Number(body.activityScore);
  if (body.responseLevel === "none" || body.responseLevel === "low" || body.responseLevel === "med" || body.responseLevel === "high") {
    patch.responseLevel = body.responseLevel;
  }
  if (
    body.stage === "found" ||
    body.stage === "contacted" ||
    body.stage === "demo_booked" ||
    body.stage === "demo_done" ||
    body.stage === "trial" ||
    body.stage === "paid"
  ) {
    patch.stage = body.stage as FirstQuebecStage;
  }
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (body.lastContactAt === null || typeof body.lastContactAt === "string") {
    patch.lastContactAt = body.lastContactAt;
  }
  if (body.nextFollowUpAt === null || typeof body.nextFollowUpAt === "string") {
    patch.nextFollowUpAt = body.nextFollowUpAt;
  }

  const r = patchFirstQuebecBroker(id, patch);
  if (!r.ok) return json({ error: r.error }, { status: 400 });
  return json({ row: r.row, summary: getFirstQuebecSummary() });
}
