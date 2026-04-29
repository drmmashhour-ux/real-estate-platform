import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "connected" });
  } catch {
    return Response.json({ ok: false, db: "failed" }, { status: 500 });
  }
}
