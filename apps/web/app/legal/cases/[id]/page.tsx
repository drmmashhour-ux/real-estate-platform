import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@repo/db";
import { LegalCaseDetail } from "@/modules/legal/components/LegalCaseDetail";

export const dynamic = "force-dynamic";

export default async function LegalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.legalCase.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <Link href="/legal" className="text-xs text-premium-gold hover:underline">
        ← Case library
      </Link>
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
        <LegalCaseDetail
          c={{
            title: c.title,
            jurisdiction: c.jurisdiction,
            summary: c.summary,
            facts: c.facts,
            legalIssues: c.legalIssues,
            decision: c.decision,
            reasoning: c.reasoning,
            outcome: c.outcome,
          }}
        />
      </div>
    </div>
  );
}
