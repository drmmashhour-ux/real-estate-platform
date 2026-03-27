import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const err = await assertAdminResponse();
  if (err) return err;
  const rows = await prisma.growthLeadCapture.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return NextResponse.json(rows);
}
