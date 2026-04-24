import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { LegalAssistantDashboardClient } from "./LegalAssistantDashboardClient";

export const metadata = {
  title: "Legal document assistant (drafts) | LECIPM / BNHub",
};

export default async function LegalAssistantDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/legal");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Legal document assistant</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Generate <strong className="text-amber-200/90">editable draft</strong> agreements and policies from templates.
          Output is informational only — not a substitute for professional legal advice.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
            Command center
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-6">
        <LegalAssistantDashboardClient />
      </div>
    </div>
  );
}
