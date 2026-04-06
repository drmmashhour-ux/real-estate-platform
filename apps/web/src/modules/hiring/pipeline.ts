import { prisma } from "@/lib/db";
import { computePerformanceFlag } from "./decisionRules";
import { computeEvaluationScores, type RubricInput } from "./scoring";
import { isHiringRole, isHiringStage, type HiringStage, type TrialTaskKey } from "./constants";

export type CreateCandidateInput = {
  name: string;
  email: string;
  role: string;
  stage?: HiringStage;
  notes?: string | null;
};

export async function createCandidate(input: CreateCandidateInput) {
  if (!isHiringRole(input.role)) throw new Error(`Invalid role: ${input.role}`);
  const stage = input.stage ?? "applied";
  if (!isHiringStage(stage)) throw new Error(`Invalid stage: ${stage}`);

  return prisma.candidate.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      stage,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateStage(candidateId: string, stage: HiringStage) {
  if (!isHiringStage(stage)) throw new Error(`Invalid stage: ${stage}`);
  const c = await prisma.candidate.findUniqueOrThrow({
    where: { id: candidateId },
    select: { score: true },
  });
  const flag = computePerformanceFlag(c.score, stage);
  return prisma.candidate.update({
    where: { id: candidateId },
    data: { stage, flag },
  });
}

export async function logInteraction(candidateId: string, type: string, summary: string) {
  const s = summary.trim();
  if (!s) throw new Error("summary required");
  return prisma.candidateInteraction.create({
    data: { candidateId, type: type.trim(), summary: s },
  });
}

export async function evaluateCandidate(candidateId: string, rubric: RubricInput) {
  const scores = computeEvaluationScores(rubric);

  return prisma.$transaction(async (tx) => {
    const evalRow = await tx.candidateEvaluation.create({
      data: {
        candidateId,
        communicationScore: scores.communicationScore,
        salesSkillScore: scores.salesSkillScore,
        executionScore: scores.executionScore,
        speedScore: scores.speedScore,
        clarityScore: scores.clarityScore,
        closingScore: scores.closingScore,
        overallScore: scores.overallScore,
      },
    });

    const candidate = await tx.candidate.findUniqueOrThrow({
      where: { id: candidateId },
      select: { stage: true },
    });
    const stage = candidate.stage as HiringStage;
    const flag = computePerformanceFlag(scores.overallScore, stage);

    await tx.candidate.update({
      where: { id: candidateId },
      data: { score: scores.overallScore, flag },
    });

    return evalRow;
  });
}

export async function assignTrialTask(
  candidateId: string,
  taskKey: TrialTaskKey,
  dueAt?: Date | null
) {
  return prisma.candidateTrialTask.create({
    data: {
      candidateId,
      taskKey,
      status: "assigned",
      dueAt: dueAt ?? undefined,
    },
  });
}

export async function submitTrialTaskResult(
  taskId: string,
  resultSummary: string,
  responseQuality?: number | null
) {
  if (!resultSummary.trim()) throw new Error("resultSummary required");
  const q =
    responseQuality != null ? Math.max(0, Math.min(10, Math.round(responseQuality))) : null;
  return prisma.candidateTrialTask.update({
    where: { id: taskId },
    data: {
      status: "submitted",
      resultSummary: resultSummary.trim(),
      responseQuality: q ?? undefined,
      completedAt: new Date(),
    },
  });
}
