import {
  autoAssignLeads,
  autoFollowUpHighIntentLeads,
  refreshUserScoresBatch,
} from "@/src/modules/ai/crmEngine";

/**
 * CRM director sweep: lead scoring sync, smart routing, automated follow-up signals.
 */
export async function runCrmDirectorSweep() {
  const [scores, assign, followUps] = await Promise.all([
    refreshUserScoresBatch(200),
    autoAssignLeads(30),
    autoFollowUpHighIntentLeads(35),
  ]);
  return { scores, assign, followUps };
}
