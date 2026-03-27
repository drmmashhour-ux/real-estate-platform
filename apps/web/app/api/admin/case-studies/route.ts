import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const err = await assertAdminResponse();
  if (err) return err;
  const rows = await prisma.caseStudy.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const err = await assertAdminResponse();
  if (err) return err;
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const challenge = typeof body.challenge === "string" ? body.challenge.trim() : "";
  const solution = typeof body.solution === "string" ? body.solution.trim() : "";
  const result = typeof body.result === "string" ? body.result.trim() : "";
  if (!title || !summary || !challenge || !solution || !result) {
    return NextResponse.json({ error: "All main fields required" }, { status: 400 });
  }

  const row = await prisma.caseStudy.create({
    data: {
      title,
      summary,
      challenge,
      solution,
      result,
      city: typeof body.city === "string" ? body.city.trim() || null : null,
      image: typeof body.image === "string" ? body.image.trim() || null : null,
      featured: Boolean(body.featured),
      isPublished: Boolean(body.isPublished),
    },
  });
  return NextResponse.json(row);
}
