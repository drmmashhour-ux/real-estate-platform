import type { StripeModeCheck } from "@/src/modules/system-validation/assertSafeTestEnvironment";
import type {
  ConversionMetrics,
  FlowRunResult,
  PerformanceSample,
  SystemValidationReport,
  ValidationError,
} from "@/src/modules/system-validation/types";

export function generateSystemReport(args: {
  usersCreated: number;
  userSummaries: Array<{ email: string; role: string; plan: string }>;
  fixtureIds?: SystemValidationReport["fixtureIds"];
  flows: FlowRunResult[];
  errors: ValidationError[];
  performance: PerformanceSample[];
  conversion: ConversionMetrics;
  scaling?: SystemValidationReport["scaling"];
  stripe: StripeModeCheck;
}): SystemValidationReport {
  const flowSuccessRate: Record<string, number> = {};
  const byFlow = new Map<string, { ok: number; total: number }>();
  for (const f of args.flows) {
    const cur = byFlow.get(f.flowId) ?? { ok: 0, total: 0 };
    cur.total += 1;
    if (f.ok) cur.ok += 1;
    byFlow.set(f.flowId, cur);
  }
  for (const [id, { ok, total }] of byFlow) {
    flowSuccessRate[id] = total ? Math.round((ok / total) * 1000) / 1000 : 0;
  }

  const recommendations: string[] = [];
  for (const p of args.performance) {
    if (p.slow) {
      recommendations.push(`Slow step: ${p.label} took ${p.durationMs}ms — profile DB or move work off the request path.`);
    }
  }
  if (args.scaling && args.scaling.failures > 0) {
    recommendations.push(`Scaling probe reported ${args.scaling.failures} failures — inspect pool size and timeouts.`);
  }
  if (args.conversion.dropOffStage) {
    recommendations.push(`Funnel drop-off signal at ${args.conversion.dropOffStage} for sampled users — verify tracking.`);
  }
  for (const e of args.errors) {
    if (e.flowId) {
      recommendations.push(`Fix ${e.flowId}: ${e.message}`);
    }
  }
  if (!recommendations.length) {
    recommendations.push("No automated regressions detected in this run — keep browser E2E and Stripe test Checkout on CI.");
  }

  const envNotes = [...args.stripe.notes];
  envNotes.push("Test users use @test.lecipm.invalid — purge with email filter when tearing down QA.");

  return {
    generatedAt: new Date().toISOString(),
    environment: {
      testMode: process.env.TEST_MODE === "true",
      nodeEnv: process.env.NODE_ENV ?? null,
      stripeSandboxOnly: args.stripe.sandboxOnly,
      notes: envNotes,
    },
    usersCreated: args.usersCreated,
    userSummaries: args.userSummaries,
    fixtureIds: args.fixtureIds,
    flows: args.flows,
    flowSuccessRate,
    errors: args.errors,
    performance: args.performance,
    scaling: args.scaling,
    conversion: args.conversion,
    recommendations,
  };
}
