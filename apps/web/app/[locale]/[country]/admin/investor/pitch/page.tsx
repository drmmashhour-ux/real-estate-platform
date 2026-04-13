import Link from "next/link";
import { redirect } from "next/navigation";
import { InvestorPitchViewer } from "@/components/investor-hub/InvestorPitchViewer";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInvestorPitchPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const pitchDeck = await prisma.pitchDeck.findFirst({
    orderBy: { createdAt: "desc" },
    include: { slides: { orderBy: { order: "asc" } } },
  });

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
            Grouped by slide type (problem, solution, market, …). Copy per slide; edit in the pitch generator.
          </p>
          <Link href="/admin/investor" className="mt-4 inline-block text-xs text-amber-400/90 hover:text-amber-300">
            ← Investor home
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <InvestorPitchViewer deck={deck} />
      </div>
    </main>
  );
}
