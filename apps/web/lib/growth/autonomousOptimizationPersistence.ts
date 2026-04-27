import "server-only";

import { randomUUID } from "node:crypto";

import { query } from "@/lib/sql";

import type { AutonomousOptimizationAction } from "./autonomousOptimizationLoop";

export type LecipmAutonomousOptimizationRunRow = {
  id: string;
  createdAt: Date;
  dryRun: boolean;
  trigger: string;
  actions: AutonomousOptimizationAction[] | unknown;
  summary: { inputErrors?: string[]; actionCount?: number } | null;
};

type InsertRow = {
  dryRun: boolean;
  trigger: string;
  actions: AutonomousOptimizationAction[];
  summary: { inputErrors: string[]; actionCount: number };
};

/**
 * Persists a run in `lecipm_autonomous_optimization_runs` (migration Order: lecipm autonomous loop).
 * Uses `query` so it works as soon as the SQL migration is applied; Prisma model mirrors the same table.
 */
export async function insertLecipmAutonomousOptimizationRun(input: InsertRow): Promise<{ id: string }> {
  const id = randomUUID();
  const actionsJson = JSON.stringify(input.actions);
  const summaryJson = JSON.stringify(input.summary);
  await query(
    `
    INSERT INTO "lecipm_autonomous_optimization_runs" ("id", "createdAt", "dryRun", "trigger", "actions", "summary")
    VALUES ($1, NOW(), $2, $3, $4::jsonb, $5::jsonb)
  `,
    [id, input.dryRun, input.trigger, actionsJson, summaryJson]
  );
  return { id };
}

export async function listLecipmAutonomousOptimizationRuns(limit: number): Promise<LecipmAutonomousOptimizationRunRow[]> {
  const rows = await query<{
    id: string;
    createdAt: string;
    dryRun: string | boolean;
    trigger: string;
    actions: unknown;
    summary: unknown;
  }>(
    `
    SELECT "id", "createdAt", "dryRun", "trigger", "actions", "summary"
    FROM "lecipm_autonomous_optimization_runs"
    ORDER BY "createdAt" DESC
    LIMIT $1
  `,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    createdAt: new Date(r.createdAt),
    dryRun: Boolean(r.dryRun),
    trigger: r.trigger,
    actions: r.actions,
    summary:
      r.summary && typeof r.summary === "object" && r.summary !== null
        ? (r.summary as LecipmAutonomousOptimizationRunRow["summary"])
        : null,
  }));
}
