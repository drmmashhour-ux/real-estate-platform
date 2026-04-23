import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET /api/notary-closing/package/:id (id = packageId)
 * Returns closing package by id.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: packageId } = await context.params;
    const pkg = await prisma.closingPackage.findUnique({
      where: { id: packageId },
      include: {
        documents: { include: { document: true } },
        transaction: true,
        generatedBy: { select: { id: true, name: true, email: true } },
        notary: true,
      },
    });
    if (!pkg) return Response.json({ error: "Closing package not found" }, { status: 404 });
    return Response.json(pkg);
  } catch (e) {
    return Response.json({ error: "Failed to load closing package" }, { status: 500 });
  }
}
