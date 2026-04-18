import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGrowthContentDrafts } from "@/modules/growth-machine";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  audience: z.enum(["host", "buyer", "investor"]),
  city: z.string().min(1).max(120),
  listingId: z.string().optional(),
  campaignGoal: z.enum(["awareness", "conversion", "retention"]),
  tone: z.enum(["luxury", "modern", "direct", "bnb"]),
  offerType: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const drafts = generateGrowthContentDrafts({
    audience: parsed.data.audience,
    city: parsed.data.city,
    listingId: parsed.data.listingId,
    campaignGoal: parsed.data.campaignGoal,
    tone: parsed.data.tone,
    offerType: parsed.data.offerType,
  });

  return NextResponse.json({ drafts, generatedBy: auth.userId });
}
