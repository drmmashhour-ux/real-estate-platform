import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { assertBnhubHostOrAdmin } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await assertBnhubHostOrAdmin(request);
    const { id: bookingId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      damageReported?: boolean;
      missingItemsNote?: string;
      hostNotes?: string;
    };

    const booking =
      user.role === PlatformRole.ADMIN
        ? await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true } })
        : await prisma.booking.findFirst({
            where: { id: bookingId, listing: { ownerId: user.id } },
            select: { id: true },
          });
    if (!booking) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const damageReported = body.damageReported === true;
    const missingItemsNote =
      typeof body.missingItemsNote === "string" ? body.missingItemsNote.slice(0, 4000) : "";
    const hostNotes = typeof body.hostNotes === "string" ? body.hostNotes.slice(0, 4000) : "";

    const description = JSON.stringify({
      damageReported,
      missingItemsNote: missingItemsNote || undefined,
      hostNotes: hostNotes || undefined,
      submittedAt: new Date().toISOString(),
      submittedByHostId: user.id,
    });

    await prisma.bookingIssue.create({
      data: {
        bookingId,
        issueType: "host_checkout_report",
        description,
        status: "open",
      },
    });

    return Response.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (err.status === 403) return Response.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
}
