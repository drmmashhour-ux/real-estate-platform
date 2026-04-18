import { prisma } from "@/lib/db";

export type LogHostLeadOutreachInput = {
  leadId: string;
  channel: string;
  message: string;
  status?: string;
  response?: string | null;
};

/** Internal / admin — append-only log for host success follow-up (no auto-send). */
export async function logHostLeadOutreach(input: LogHostLeadOutreachInput) {
  return prisma.hostLeadOutreachLog.create({
    data: {
      leadId: input.leadId,
      channel: input.channel.slice(0, 32),
      message: input.message,
      status: input.status ?? "logged",
      response: input.response ?? undefined,
    },
  });
}
