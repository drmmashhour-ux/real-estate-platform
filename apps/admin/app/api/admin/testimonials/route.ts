import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const err = await assertAdminResponse();
  if (err) return err;
  const rows = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const err = await assertAdminResponse();
  if (err) return err;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const quote = typeof body.quote === "string" ? body.quote.trim() : "";
  if (!name || !quote) {
    return NextResponse.json({ error: "name and quote required" }, { status: 400 });
  }

  const row = await prisma.testimonial.create({
    data: {
      name,
      quote,
      role: typeof body.role === "string" ? body.role.trim() || null : null,
      city: typeof body.city === "string" ? body.city.trim() || null : null,
      rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
      image: typeof body.image === "string" ? body.image.trim() || null : null,
      featured: Boolean(body.featured),
      isApproved: Boolean(body.isApproved),
    },
  });
  return NextResponse.json(row);
}
