import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { buildDeck } from "@/src/modules/pitchDeck/generator";

export const dynamic = "force-dynamic";

export async function POST() {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const deck = await buildDeck();
    return Response.json({
      id: deck.id,
      title: deck.title,
      createdAt: deck.createdAt.toISOString(),
      slideCount: deck.slides.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
