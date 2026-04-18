import { NextResponse } from "next/server";
import { z } from "zod";
import { captureGrowthLead } from "@/modules/lead-gen";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { handlePublicLandingCaptureJson } from "../shared-public-capture";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  message: z.string().min(1).max(8000),
  intentCategory: z.enum(["buyer", "seller", "broker", "host", "investor", "renter"]),
  source: z.string().optional(),
  campaign: z.string().optional(),
  medium: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  referrerUrl: z.string().optional(),
  leadSource: z.string().optional(),
  fsboListingId: z.string().optional(),
  shortTermListingId: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body === "object" &&
    body !== null &&
    (body as { publicAcquisition?: unknown }).publicAcquisition === true
  ) {
    return handlePublicLandingCaptureJson(body, req);
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const result = await captureGrowthLead({
    ...parsed.data,
    userId: auth.userId,
    introducedByBrokerId: undefined,
  });

  return NextResponse.json(result);
}
