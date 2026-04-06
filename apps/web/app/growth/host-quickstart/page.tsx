import type { Metadata } from "next";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host quick start | LECIPM",
  description: "Create a listing fast with AI-assisted copy and publish to BNHub.",
};

export default async function HostQuickstartPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/growth/host-quickstart");
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto max-w-2xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">LECIPM Manager</p>
        <h1 className="mt-3 text-3xl font-bold">Host acquisition — quick start</h1>
        <p className="mt-4 text-sm text-slate-400">
          List a stay in minutes. Use the BNHub wizard for photos, pricing, and instant publish when your listing passes
          checks.
        </p>
        <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm text-slate-300">
          <li>
            Open the{" "}
            <Link href="/bnhub/host/listings/new" className="text-[#D4AF37] underline-offset-2 hover:underline">
              new listing wizard
            </Link>{" "}
            (structured steps, saved drafts).
          </li>
          <li>
            Use{" "}
            <Link href="/api/ai/listing-analysis" className="text-[#D4AF37] underline-offset-2 hover:underline">
              listing analysis
            </Link>{" "}
            from the product, or Design Studio for copy polish.
          </li>
          <li>Submit for verification and publish when status is live.</li>
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/bnhub/host/listings/new"
            className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black hover:brightness-110"
          >
            Start listing
          </Link>
          <Link
            href="/dashboard/host"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            Host dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
