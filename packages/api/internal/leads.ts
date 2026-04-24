import type { LeadRecord } from "./types";

export type LeadsServiceContext = {
  partnerId?: string;
};

const stub: LeadRecord[] = [
  {
    id: "lead_stub_1",
    source: "marketplace",
    status: "new",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Internal leads service — replace with Prisma / CRM queries.
 */
export async function listLeads(_ctx: LeadsServiceContext): Promise<LeadRecord[]> {
  return stub.map((l) => ({ ...l, partnerId: _ctx.partnerId }));
}

export async function createLead(
  ctx: LeadsServiceContext,
  input: { source?: string; status?: string }
): Promise<LeadRecord> {
  const rec: LeadRecord = {
    id: `lead_${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`,
    source: input.source ?? "api",
    status: input.status ?? "new",
    createdAt: new Date().toISOString(),
    partnerId: ctx.partnerId,
  };
  stub.unshift(rec);
  return rec;
}
