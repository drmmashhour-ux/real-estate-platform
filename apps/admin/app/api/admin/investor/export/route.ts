import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { buildInvestorBundleMarkdown } from "@/lib/admin/investor-bundle-markdown";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** PDF-ready: plain Markdown bundle (metrics + pitch slides + Q&A). Open in Word / print to PDF. */
export async function GET() {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let deck: { title: string; slides: Array<{ order: number; type: string; title: string; content: unknown }> } | null =
    null;
  try {
    const latest = await prisma.pitchDeck.findFirst({
      orderBy: { createdAt: "desc" },
      include: { slides: { orderBy: { order: "asc" } } },
    });
    if (latest) {
      deck = {
        title: latest.title,
        slides: latest.slides.map((s) => ({
          order: s.order,
          type: s.type,
          title: s.title,
          content: s.content,
        })),
      };
    }
  } catch {
    /* optional */
  }

  const qa = await prisma.investorQA.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const md = await buildInvestorBundleMarkdown({
    pitchDeckTitle: deck?.title ?? null,
    slides: deck?.slides ?? [],
    qa,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="lecipm-investor-bundle-${stamp}.md"`,
    },
  });
}
