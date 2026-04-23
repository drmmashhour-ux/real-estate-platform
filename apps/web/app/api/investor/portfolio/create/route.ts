import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/modules/security/access-guard.service";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const propertySchema = z.object({
  address: z.string().min(1).max(500),
  city: z.string().max(160).optional(),
  capRate: z.number().optional(),
  roiPercent: z.number().optional(),
  monthlyCashflowCents: z.number().int().optional(),
  dscr: z.number().optional(),
  neighborhoodScore: z.number().optional(),
  currentValueCents: z.number().int().optional(),
});

const bodySchema = z.object({
  title: z.string().max(240).optional(),
  notes: z.string().max(5000).optional(),
  properties: z.array(propertySchema).optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, notes, properties } = parsed.data;

  const portfolio = await prisma.portfolioBook.create({
    data: {
      ownerUserId: auth.userId,
      title: title?.trim() || "Portfolio",
      notes: notes?.trim() || undefined,
      properties:
        properties && properties.length > 0 ?
          {
            create: properties.map((p) => ({
              address: p.address,
              city: p.city,
              capRate: p.capRate,
              roiPercent: p.roiPercent,
              monthlyCashflowCents: p.monthlyCashflowCents,
              dscr: p.dscr,
              neighborhoodScore: p.neighborhoodScore,
              currentValueCents: p.currentValueCents,
            })),
          }
        : undefined,
    },
    include: { properties: true },
  });

  await recordAuditEvent({
    actorUserId: auth.userId,
    action: "PORTFOLIO_BOOK_CREATED",
    payload: { portfolioId: portfolio.id, propertyCount: portfolio.properties.length },
  });

  for (const p of portfolio.properties) {
    await recordAuditEvent({
      actorUserId: auth.userId,
      action: "PORTFOLIO_PROPERTY_ADDED",
      payload: { portfolioId: portfolio.id, propertyId: p.id, address: p.address },
    });
  }

  return NextResponse.json({ success: true, portfolio });
}
