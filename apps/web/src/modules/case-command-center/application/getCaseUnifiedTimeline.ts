import { prisma } from "@/lib/db";
import type { CaseTimelineEvent } from "@/src/modules/case-command-center/domain/case.types";

const TAKE_EACH = 12;
const MAX_MERGED = 25;

/**
 * Unified, time-sorted activity for the case (audit, workflow, AI, signatures in metadata).
 */
export async function getCaseUnifiedTimeline(documentId: string): Promise<CaseTimelineEvent[]> {
  const [audits, wf, ai, sigs] = await Promise.all([
    prisma.documentAuditLog.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      take: TAKE_EACH,
      select: { id: true, actionType: true, createdAt: true, metadata: true },
    }),
    prisma.workflowAutomationEvent.findMany({
      where: { entityType: "seller_declaration_draft", entityId: documentId },
      orderBy: { createdAt: "desc" },
      take: TAKE_EACH,
      select: { id: true, actionType: true, triggerType: true, status: true, createdAt: true },
    }),
    prisma.sellerDeclarationAiEvent.findMany({
      where: { draftId: documentId },
      orderBy: { createdAt: "desc" },
      take: TAKE_EACH,
      select: { id: true, actionType: true, sectionKey: true, createdAt: true },
    }),
    prisma.documentSignature.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      take: TAKE_EACH,
      select: { id: true, status: true, signerName: true, createdAt: true, signedAt: true },
    }),
  ]);

  const merged: CaseTimelineEvent[] = [];

  for (const a of audits) {
    merged.push({
      id: `audit-${a.id}`,
      createdAt: a.createdAt.toISOString(),
      kind: "audit",
      title: humanizeAction(a.actionType),
      detail: typeof a.metadata === "object" && a.metadata && "sectionKey" in (a.metadata as object)
        ? String((a.metadata as { sectionKey?: string }).sectionKey ?? "")
        : undefined,
    });
  }
  for (const w of wf) {
    merged.push({
      id: `wf-${w.id}`,
      createdAt: w.createdAt.toISOString(),
      kind: "workflow",
      title: w.actionType,
      detail: `${w.triggerType} · ${w.status}`,
    });
  }
  for (const e of ai) {
    merged.push({
      id: `ai-${e.id}`,
      createdAt: e.createdAt.toISOString(),
      kind: "ai",
      title: `AI: ${e.actionType}`,
      detail: e.sectionKey,
    });
  }
  for (const s of sigs) {
    merged.push({
      id: `sig-${s.id}`,
      createdAt: (s.signedAt ?? s.createdAt).toISOString(),
      kind: "signature",
      title: `Signature: ${s.signerName}`,
      detail: s.status,
    });
  }

  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const seen = new Set<string>();
  const deduped: CaseTimelineEvent[] = [];
  for (const m of merged) {
    const key = `${m.kind}-${m.title}-${m.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(m);
    if (deduped.length >= MAX_MERGED) break;
  }
  return deduped;
}

function humanizeAction(actionType: string): string {
  return actionType.replace(/_/g, " ");
}
