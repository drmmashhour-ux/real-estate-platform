import Link from "next/link";
import { AiLearningDashboardClient } from "@/components/admin/AiLearningDashboardClient";

export const dynamic = "force-dynamic";

export default function AdminAiLearningPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <Link href="/admin/ai-inbox" className="text-sm text-amber-400 hover:text-amber-300">
            ← AI inbox
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-amber-400/90">Growth</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-white">AI messaging — self-learning</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Template performance rollups, experiment stats, and recommendations on top of the deterministic classifier.
            Global auto-override stays off unless <code className="text-slate-400">AI_SELF_LEARNING_ROUTING_ENABLED=1</code>.
          </p>
        </header>

        <AiLearningDashboardClient />
      </div>
    </div>
  );
}
