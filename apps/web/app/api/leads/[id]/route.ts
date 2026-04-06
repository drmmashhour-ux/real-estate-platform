import { NextRequest } from "next/server";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  getDmAutomationSuggestions,
  getRecommendedAutomationAction,
} from "@/lib/automation/lead-automation-ui";
import { getLeadRevenueSnapshot } from "@/src/modules/revenue/revenueEngine";
import { canBrokerOrAdminAccessLead } from "@/lib/leads/can-access-lead";
import { getDealLegalTimeline } from "@/lib/deals/legal-timeline";

export const dynamic = "force-dynamic";

/** GET: single lead (broker/admin) with CRM notes. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        introducedByBroker: { select: { id: true, name: true, email: true } },
        lastFollowUpByBroker: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, status: true, leadContactOrigin: true, commissionEligible: true } },
        ...(viewer.role === "ADMIN"
          ? { contactAuditEvents: { orderBy: { createdAt: "desc" as const }, take: 40 } }
          : {}),
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { broker: { select: { id: true, name: true, email: true } } },
        },
        crmInteractions: {
          orderBy: { createdAt: "desc" },
          take: 80,
          include: { broker: { select: { id: true, name: true, email: true } } },
        },
        automationTasks: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          take: 40,
        },
        leadTasks: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          take: 60,
        },
      },
    });
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!canBrokerOrAdminAccessLead(viewer.role, viewerId, lead)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const revenueSnapshot = await getLeadRevenueSnapshot(id);
    const legalTimeline = lead.deal?.id ? await getDealLegalTimeline(lead.deal.id).catch(() => null) : null;

    const response = {
      ...lead,
      contactOriginLabel:
        lead.contactOrigin === LeadContactOrigin.IMMO_CONTACT
          ? "ImmoContact"
          : lead.contactOrigin === LeadContactOrigin.PLATFORM_BROKER
            ? "Platform broker"
            : lead.contactOrigin === LeadContactOrigin.DIRECT
              ? "Direct"
              : null,
      email: lead.contactUnlockedAt ? lead.email : "[Locked]",
      phone: lead.contactUnlockedAt ? lead.phone : "[Locked]",
      isLocked: !lead.contactUnlockedAt,
      status: lead.pipelineStatus || lead.status,
      automation: {
        dmSuggestions: getDmAutomationSuggestions({
          dmStatus: lead.dmStatus,
          lastDmAt: lead.lastDmAt,
          pipelineStatus: lead.pipelineStatus,
        }),
        recommendedAction: getRecommendedAutomationAction({
          pipelineStatus: lead.pipelineStatus,
          highIntent: lead.highIntent,
          score: lead.score,
          meetingAt: lead.meetingAt,
          leadSource: lead.leadSource,
          lastContactedAt: lead.lastContactedAt,
        }),
      },
      revenuePotential: revenueSnapshot.openOpportunityValue,
      revenuePushActions: revenueSnapshot.pushActions,
      dealLegalTimeline: legalTimeline
        ? {
            dealId: legalTimeline.dealId,
            currentStage: legalTimeline.currentStage,
            stages: legalTimeline.stages,
            events: legalTimeline.events.map((event) => ({
              id: event.id,
              createdAt: event.createdAt.toISOString(),
              note: event.note,
              stage: event.stage,
            })),
          }
        : null,
    };
    return Response.json(response);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}
