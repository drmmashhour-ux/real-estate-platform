import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RetentionAdminClient } from "./RetentionAdminClient";

export const metadata = {
  title: "Guest retention engine | LECIPM / BNHub",
};

export default async function RetentionDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/retention");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/admin/command-center");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Guest retention engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Behavior-driven segments, return score, and calm nurture copy. Messages are{" "}
          <strong className="text-amber-200/90">capped per week</strong>, respect{" "}
          <strong className="text-amber-200/90">quiet hours</strong> and{" "}
          <strong className="text-amber-200/90">email opt-in</strong>, and can be disabled via BNHub prefs{" "}
          <code className="text-zinc-500">retentionNurtureDisabled</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
            ← Command center
          </Link>
          <Link href="/api/retention/me" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            Sample API (self)
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-6">
        <RetentionAdminClient />
      </div>
    </div>
  );
}
