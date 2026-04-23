import Link from "next/link";
import { redirect } from "next/navigation";
import { InvestorPitchPanel } from "@/components/investor-hub/InvestorPitchPanel";
import { InvestorPitchViewer } from "@/components/investor-hub/InvestorPitchViewer";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { assessInvestorReadiness } from "@/modules/investor/pitch-format";
import {
  buildPitchDeckFromContext,
  loadPitchDeckContextFull,
} from "@/modules/investor/pitch-generator.service";

export const dynamic = "force-dynamic";

export default async function AdminInvestorPitchPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const [pitchDeck, pitchCtx] = await Promise.all([
    prisma.pitchDeck.findFirst({
      orderBy: { createdAt: "desc" },
      include: { slides: { orderBy: { order: "asc" } } },
    }),
    loadPitchDeckContextFull(),
  ]);

  const { readiness, risks } = assessInvestorReadiness(pitchCtx);
  const generatedDecks = {
    short: buildPitchDeckFromContext(pitchCtx, "short"),
    standard: buildPitchDeckFromContext(pitchCtx, "standard"),
    long: buildPitchDeckFromContext(pitchCtx, "long"),
  };

  const deck = pitchDeck
    ? {
        title: pitchDeck.title,
        createdAtLabel: `${pitchDeck.createdAt.toISOString().slice(0, 19)}Z`,
        slides: pitchDeck.slides.map((s) => ({
          order: s.order,
          type: s.type,
          title: s.title,
          content: s.content,
        })),
      }
    : null;

  return (
    <main className="pb-16">
      <section className="border-b border-amber-900/25 bg-zinc-950/50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Pitch</p>
          <h1 className="mt-2 font-serif text-2xl text-amber-100">Slide-by-slide viewer</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Generated LECIPM narrative (metrics-backed) below; CMS deck viewer follows for stored slides.
          </p>
          <Link href="/admin/investor" className="mt-4 inline-block text-xs text-amber-400/90 hover:text-amber-300">
            ← Investor home
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-amber-500/20 bg-zinc-950/40 p-6">
          <InvestorPitchPanel decks={generatedDecks} readiness={readiness} risks={risks} />
        </section>
        <section>
          <h2 className="mb-4 font-serif text-lg text-amber-200/90">Published deck (database)</h2>
          <InvestorPitchViewer deck={deck} />
        </section>
      </div>
    </main>
  );
}
