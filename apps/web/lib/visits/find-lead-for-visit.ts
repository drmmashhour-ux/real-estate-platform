import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type VisitLeadRow = {
  id: string;
  thread_id: string | null;
  broker_user_id: string;
  customer_user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
};

export async function findLeadForVisitRequest(opts: {
  listingId: string;
  leadId?: string | null;
  threadId?: string | null;
}): Promise<VisitLeadRow | null> {
  if (opts.leadId) {
    const rows = await prisma.$queryRaw<VisitLeadRow[]>(
      Prisma.sql`SELECT id, thread_id, broker_user_id, customer_user_id, guest_name, guest_email
        FROM lecipm_broker_crm_leads
        WHERE id = ${opts.leadId} AND listing_id = ${opts.listingId}
        LIMIT 1`
    );
    return rows[0] ?? null;
  }
  if (opts.threadId) {
    const rows = await prisma.$queryRaw<VisitLeadRow[]>(
      Prisma.sql`SELECT id, thread_id, broker_user_id, customer_user_id, guest_name, guest_email
        FROM lecipm_broker_crm_leads
        WHERE thread_id = ${opts.threadId} AND listing_id = ${opts.listingId}
        LIMIT 1`
    );
    return rows[0] ?? null;
  }
  return null;
}
