import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildContractPdfBufferForUser } from "@/lib/pdf/contract-pdf-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/contracts/[id]/pdf — Download contract PDF (participants only).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  const result = await buildContractPdfBufferForUser({
    contractId: id,
    userId,
    userRole: user.role,
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const bytes = new Uint8Array(result.buffer.length);
  bytes.set(result.buffer);
  return new Response(new Blob([bytes]), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
