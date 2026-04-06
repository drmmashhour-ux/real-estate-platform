import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { PitchDeckAdminClient } from "@/components/admin/PitchDeckAdminClient";
import { prisma } from "@/lib/db";
import { PYTHON_PPTX_DEFAULT_PATH } from "@/src/modules/pitchDeck/export";

export const dynamic = "force-dynamic";

type PitchDeckWithSlides = Prisma.PitchDeckGetPayload<{
  include: { slides: { orderBy: { order: "asc" } } };
}>;

export default async function AdminPitchDeckPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  let latest: PitchDeckWithSlides | null = null;
  try {
    latest = await prisma.pitchDeck.findFirst({
      orderBy: { createdAt: "desc" },
      include: { slides: { orderBy: { order: "asc" } } },
    });
  } catch {
    /* migration pending */
  }

  const slides =
    latest?.slides.map((s: PitchDeckWithSlides["slides"][number]) => ({
      id: s.id,
      order: s.order,
      type: s.type,
      title: s.title,
      content: s.content,
    })) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Investor materials</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pitch deck generator</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Builds an 8-slide narrative from <strong className="text-slate-300">live</strong> investor metrics (users,
            active users, bookings, revenue, conversion, growth). Download PPTX for offline edits.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Optional python-pptx: <code className="text-slate-500">scripts/pitch_deck_pptx.py</code> — default output{" "}
            <code className="text-slate-500">{PYTHON_PPTX_DEFAULT_PATH}</code>
          </p>
          <div className="mt-4">
            <Link href="/admin" className="text-sm text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {latest ? (
            <p className="mb-6 text-sm text-slate-500">
              Latest: <span className="text-slate-300">{latest.title}</span> ·{" "}
              {latest.createdAt.toISOString().slice(0, 19)}Z · {latest.slides.length} slides
            </p>
          ) : null}
          <PitchDeckAdminClient deckId={latest?.id ?? null} slides={slides} />
          <p className="mt-12 text-center text-xs font-medium tracking-wide text-violet-400/90">
            LECIPM PITCH DECK GENERATOR ACTIVE
          </p>
        </div>
      </section>
    </main>
  );
}
