import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";

const bodySchema = z.object({
  city: z.string().optional(),
  province: z.string().max(8).optional(),
});

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const province = parsed.data.province ?? "QC";

  const rows = await prisma.neighborhoodProfile.findMany({
    where: {
      province,
      ...(parsed.data.city?.trim() ?
        { city: { equals: parsed.data.city.trim(), mode: "insensitive" } }
      : {}),
    },
    orderBy: [{ scoreOverall: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ success: true, rows });
}
