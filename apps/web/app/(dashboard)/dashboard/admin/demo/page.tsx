import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DemoWalkthroughPanel } from "@/components/demo/DemoWalkthroughPanel";
import { loadDemoWalkthroughData } from "@/lib/demo/demo-walkthrough-data";

export const dynamic = "force-dynamic";

/**
 * Admin-only entry (same content as `/dashboard/demo` plus staging pointer).
 * @see `/dashboard/demo` for brokers and clients.
 */
export default async function DashboardAdminDemoWalkthroughPage() {
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent("/dashboard/admin/demo")}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const data = await loadDemoWalkthroughData();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-10 text-slate-100">
      <DemoWalkthroughPanel data={data} showStagingTools />
    </main>
  );
}
