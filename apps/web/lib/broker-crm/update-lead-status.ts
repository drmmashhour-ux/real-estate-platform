import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { recordCrmPipelineEvent } from "@/modules/crm/crm.service";
import { crmLog } from "@/modules/crm/crm-pipeline-logger";

export async function updateBrokerCrmLeadStatus(leadId: string, status: LecipmBrokerCrmLeadStatus, brokerUserId: string) {
  const prev = await prisma.lecipmBrokerCrmLead.findUnique({
    where: { id: leadId },
    select: { status: true },
  });

  const lead = await prisma.lecipmBrokerCrmLead.update({
    where: { id: leadId },
    data: { status },
  });

  try {
    await recordCrmPipelineEvent({
      type: "broker_crm_status_changed",
      entityType: "broker_crm_lead",
      entityId: leadId,
      message: `CRM status ${prev?.status ?? "?"} → ${status}`,
      brokerUserId,
      metadata: { previousStatus: prev?.status ?? null, nextStatus: status },
    });
  } catch (e: unknown) {
    crmLog.error("pipeline_event_after_status_failed", {
      message: e instanceof Error ? e.message : String(e),
      leadId,
    });
  }
  trackBrokerCrm(
    "broker_crm_status_changed",
    { leadId, status },
    { userId: brokerUserId }
  );
  if (status === "contacted") {
    trackBrokerCrm("broker_crm_lead_marked_contacted", { leadId }, { userId: brokerUserId });
  }
  if (status === "qualified") {
    trackBrokerCrm("broker_crm_lead_qualified", { leadId }, { userId: brokerUserId });
  }
  if (status === "closed" || status === "lost") {
    trackBrokerCrm("broker_crm_lead_closed", { leadId, status }, { userId: brokerUserId });
  }
  return lead;
}
