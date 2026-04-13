import Link from "next/link";
import { ExpertAiToolsClient } from "./expert-ai-tools-client";

export const dynamic = "force-dynamic";

export default function ExpertAiToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400/80">Financing desk</p>
        <h1 className="mt-1 text-2xl font-bold text-white">AI writing assistant</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Translate, polish, and structure client communications. Designed for mortgage professionals — fast, calm, and
          easy to scan.
        </p>
        <Link href="/dashboard/expert" className="mt-3 inline-block text-xs text-slate-500 hover:text-premium-gold">
          ← Back to desk
        </Link>
      </div>
      <ExpertAiToolsClient />
    </div>
  );
}
