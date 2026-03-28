import Link from "next/link";
import { AiAutoReplyInboxClient } from "@/components/admin/AiAutoReplyInboxClient";

export const dynamic = "force-dynamic";

export default function AdminAiInboxPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/messaging" className="text-amber-400 hover:text-amber-300">
              ← Messaging
            </Link>
            <Link href="/admin/ai-learning" className="text-amber-400 hover:text-amber-300">
              Self-learning dashboard →
            </Link>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-amber-400/90">Growth</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-white">AI auto-reply inbox</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Rule-based classifier on inbound user lines; templates in <code className="text-slate-400">auto_reply_templates</code>.
            Threads live in <code className="text-slate-400">growth_ai_conversations</code> (separate from CRM{" "}
            <code className="text-slate-400">conversations</code>).
          </p>
        </header>

        <AiAutoReplyInboxClient />
      </div>
    </div>
  );
}
