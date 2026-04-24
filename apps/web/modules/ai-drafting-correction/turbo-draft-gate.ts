import { prisma } from "@/lib/db";
import type { AiRiskFinding, TurboDraftAiStatus } from "@/modules/ai-drafting-correction/types";

export function computeTurboDraftStatusFromFindings(findings: AiRiskFinding[]): TurboDraftAiStatus {
  const criticalBlocking = findings.some((f) => f.severity === "CRITICAL" && f.blocking);
  if (criticalBlocking) return "BLOCKED";
  const critical = findings.some((f) => f.severity === "CRITICAL");
  const blockingWarn = findings.some((f) => f.severity === "WARNING" && f.blocking);
  if (critical || blockingWarn) return "NEEDS_REVIEW";
  return "READY_TO_SIGN";
}

export function canProceedToSign(status: TurboDraftAiStatus): boolean {
  return status === "READY_TO_SIGN";
}

export async function assertAiDraftClearForSignature(
  draftId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const open = await prisma.aiDraftFinding.findMany({
    where: {
      draftId,
      userId,
      resolved: false,
      OR: [{ blocking: true }, { severity: "CRITICAL" }],
    },
    take: 20,
  });
  if (!open.length) return { ok: true };
  return {
    ok: false,
    errors: open.map((f) => `[${f.findingKey}] ${f.messageFr}`),
  };
}
