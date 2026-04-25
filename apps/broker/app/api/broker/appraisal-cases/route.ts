import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { createBrokerAppraisalCase } from "@/lib/appraisal/broker-appraisal-case.service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  subjectListingId: z.string().min(1),
  title: z.string().optional(),
});

export async function GET() {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const rows = await prisma.lecipmBrokerAppraisalCase.findMany({
    where: { brokerUserId: auth.user.id },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      reportNumber: true,
      subjectListingId: true,
      comparablesReviewed: true,
      adjustmentsReviewed: true,
      assumptionsReviewed: true,
      conclusionReviewed: true,
      brokerApproved: true,
      valueIndicationCents: true,
      finalizedAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ cases: rows });
}

export async function POST(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const row = await createBrokerAppraisalCase({
      brokerUserId: auth.user.id,
      subjectListingId: body.subjectListingId,
      title: body.title,
    });
    return NextResponse.json({ case: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "CREATE_FAILED";
    const status = msg === "FORBIDDEN" || msg === "LISTING_NOT_FOUND" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
