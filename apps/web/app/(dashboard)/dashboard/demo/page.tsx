import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { DemoWalkthroughPanel } from "@/components/demo/DemoWalkthroughPanel";
import { loadDemoWalkthroughData } from "@/lib/demo/demo-walkthrough-data";

export const dynamic = "force-dynamic";

/** Demo quick map for any authenticated user (brokers, clients, assistants). */
export default async function DashboardDemoPage() {
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent("/dashboard/demo")}`);

  const data = await loadDemoWalkthroughData();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-10 text-slate-100">
      <DemoWalkthroughPanel data={data} />
    </main>
  );
}
