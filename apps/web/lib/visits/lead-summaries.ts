import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function fetchLecipmLeadSummaries(
  leadIds: string[]
): Promise<Map<string, { guestName: string | null; guestEmail: string | null }>> {
  const unique = [...new Set(leadIds)].filter(Boolean);
  const out = new Map<string, { guestName: string | null; guestEmail: string | null }>();
  if (unique.length === 0) return out;

  const rows = await prisma.$queryRaw<Array<{ id: string; guest_name: string | null; guest_email: string | null }>>(
    Prisma.sql`SELECT id, guest_name, guest_email FROM lecipm_broker_crm_leads WHERE id IN (${Prisma.join(unique)})`
  );
  for (const r of rows) {
    out.set(r.id, { guestName: r.guest_name, guestEmail: r.guest_email });
  }
  return out;
}
