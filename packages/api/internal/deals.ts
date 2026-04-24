import type { DealRecord } from "./types";

export type DealsServiceContext = {
  partnerId?: string;
};

const stub: DealRecord[] = [
  {
    id: "deal_stub_1",
    title: "Sample acquisition",
    stage: "diligence",
    updatedAt: new Date().toISOString(),
  },
];

export async function listDeals(ctx: DealsServiceContext): Promise<DealRecord[]> {
  return stub.map((d) => ({ ...d, partnerId: ctx.partnerId }));
}

export async function updateDealStage(
  ctx: DealsServiceContext,
  dealId: string,
  stage: string
): Promise<DealRecord | null> {
  const d = stub.find((x) => x.id === dealId);
  if (!d) return null;
  d.stage = stage;
  d.updatedAt = new Date().toISOString();
  d.partnerId = ctx.partnerId;
  return { ...d };
}
