import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getPlaybookSnapshotForLead } from "@/src/modules/playbooks/playbookEngine";
import { canBrokerOrAdminAccessLead } from "@/lib/leads/can-access-lead";

export const dynamic = "force-dynamic";

/** GET: conversion playbook snapshot for CRM / Sales Assistant (optional Deal Assistant merge). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.startsWith("mem-")) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const viewerId = await getGuestId();
  if (!viewerId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
      leadSource: true,
    },
  });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
  if (!canBrokerOrAdminAccessLead(viewer.role, viewerId, lead)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const compose = req.nextUrl.searchParams.get("compose") === "1";
  try {
    const snapshot = await getPlaybookSnapshotForLead(id, { composeWithDealAssistant: compose });
    if (!snapshot) {
      return Response.json({ error: "Playbook unavailable" }, { status: 503 });
    }
    return Response.json(snapshot);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load playbook" }, { status: 500 });
  }
}
