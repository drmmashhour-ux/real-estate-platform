import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { buildPitchDeckPptxBuffer, DEFAULT_PPTX_FILENAME } from "@/src/modules/pitchDeck/export";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ deckId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { deckId } = await ctx.params;
  const deck = await prisma.pitchDeck.findUnique({
    where: { id: deckId },
    include: { slides: { orderBy: { order: "asc" } } },
  });
  if (!deck) return Response.json({ error: "Not found" }, { status: 404 });

  const buf = await buildPitchDeckPptxBuffer(deck.slides);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${DEFAULT_PPTX_FILENAME}"`,
    },
  });
}
