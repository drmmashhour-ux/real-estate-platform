import { prisma } from "@/lib/db";

const EMAIL_2_KEY = "eval_email_followup_2";
const EMAIL_3_KEY = "eval_email_followup_3";

/** Schedule drip emails (days 2 and 5) after evaluation — processed by /api/cron/follow-up-jobs */
export async function scheduleEvaluationEmailJobs(leadId: string): Promise<void> {
  const exists = await prisma.leadFollowUpJob.findFirst({
    where: { leadId, jobKey: EMAIL_2_KEY, status: "pending" },
    select: { id: true },
  });
  if (exists) return;

  const d24 = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const d72 = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await prisma.leadFollowUpJob.createMany({
    data: [
      { leadId, jobKey: EMAIL_2_KEY, scheduledFor: d24 },
      { leadId, jobKey: EMAIL_3_KEY, scheduledFor: d72 },
    ],
  });

  await prisma.lead
    .update({
      where: { id: leadId },
      data: { evaluationEmailStatus: "drip_scheduled" },
    })
    .catch(() => {});
}

export { EMAIL_2_KEY, EMAIL_3_KEY };
