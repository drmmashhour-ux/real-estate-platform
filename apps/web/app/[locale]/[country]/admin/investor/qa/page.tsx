import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminInvestorQAPanel } from "@/components/admin/AdminInvestorQAPanel";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export const dynamic = "force-dynamic";

export default async function AdminInvestorQAPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  return (
    <main className="pb-16">
      <section className="border-b border-amber-900/25 bg-zinc-950/50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Q&A</p>
          <h1 className="mt-2 font-serif text-2xl text-amber-100">Investor diligence</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Search, filter by category and difficulty, edit canonical answers for fundraising conversations.
          </p>
          <Link href="/admin/investor" className="mt-4 inline-block text-xs text-amber-400/90 hover:text-amber-300">
            ← Investor home
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <AdminInvestorQAPanel />
      </div>
    </main>
  );
}
