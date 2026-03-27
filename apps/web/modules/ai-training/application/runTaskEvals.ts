import type { PrismaClient, Prisma } from "@prisma/client";
import type { EvalItemInput } from "../domain/types";

export async function runTaskEvals(
  db: PrismaClient,
  input: {
    subsystem: string;
    name: string;
    items: EvalItemInput[];
    runner: (item: EvalItemInput) => Promise<{ actualOutput: Record<string, unknown>; passed?: boolean; notes?: string }>;
  }
) {
  const run = await db.aiEvalRun.create({
    data: {
      subsystem: input.subsystem,
      name: input.name,
      status: "running",
    },
  });

  let pass = 0;
  let fail = 0;

  for (const item of input.items) {
    const out = await input.runner(item);
    const passed = out.passed ?? Boolean(out.actualOutput);
    if (passed) pass += 1;
    else fail += 1;
    await db.aiEvalItem.create({
      data: {
        evalRunId: run.id,
        inputPayload: item.inputPayload as Prisma.InputJsonValue,
        expectedOutput: (item.expectedOutput ?? undefined) as Prisma.InputJsonValue | undefined,
        actualOutput: out.actualOutput as Prisma.InputJsonValue,
        passed,
        notes: out.notes ?? null,
      },
    });
  }

  const metrics = {
    total: input.items.length,
    passed: pass,
    failed: fail,
    passRate: input.items.length ? pass / input.items.length : 0,
  };

  await db.aiEvalRun.update({
    where: { id: run.id },
    data: {
      status: "completed",
      metrics: metrics as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });

  return { runId: run.id, metrics };
}
