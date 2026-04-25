import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { createBrokerToBrokerReferral } from "@/modules/growth/referral.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  reward: z.enum(["priority_routing", "credit_discount_v1"]).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }
  if (auth.user.role !== "BROKER" && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Brokers only" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join("; ") }, { status: 400 });
  }
  const r = await createBrokerToBrokerReferral(auth.user.id, parsed.data.email, parsed.data.reward ?? "priority_routing");
  return NextResponse.json(r);
}
