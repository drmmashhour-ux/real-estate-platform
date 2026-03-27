import {
  loadListingSimulationContext,
  runOfferScenarioSimulation,
} from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import { prisma } from "@/lib/db";

const DEFAULT_CONCURRENCY = 50;

type ScalingResult = {
  concurrentTasks: number;
  totalDurationMs: number;
  failures: number;
  p95Ms: number;
};

/**
 * Lightweight load probe: concurrent DB read + deterministic simulator CPU.
 * Not a substitute for k6 or Playwright load tests against a running server.
 */
export async function runScalingSimulation(args: {
  listingId: string;
  concurrency?: number;
}): Promise<ScalingResult> {
  const n = Math.min(200, Math.max(1, args.concurrency ?? DEFAULT_CONCURRENCY));
  const latencies: number[] = [];
  let failures = 0;
  const t0 = globalThis.performance.now();

  await Promise.all(
    Array.from({ length: n }, async () => {
      const t = globalThis.performance.now();
      try {
        const ctx = await loadListingSimulationContext(args.listingId);
        if (!ctx) throw new Error("no ctx");
        const input = {
          propertyId: args.listingId,
          offerPriceCents: Math.round(ctx.listPriceCents * 0.97),
          depositAmountCents: Math.round(ctx.listPriceCents * 0.04),
          financingCondition: true,
          inspectionCondition: true,
          documentReviewCondition: true,
          occupancyDate: null,
          signatureDate: null,
          userStrategyMode: null,
        };
        runOfferScenarioSimulation(input, ctx);
        latencies.push(globalThis.performance.now() - t);
      } catch {
        failures += 1;
        latencies.push(globalThis.performance.now() - t);
      }
    }),
  );

  await Promise.all(
    Array.from({ length: Math.min(n, 25) }, async () => {
      try {
        await prisma.user.count({ where: { email: { contains: "lecipm.sv" } } });
      } catch {
        failures += 1;
      }
    }),
  );

  const totalDurationMs = globalThis.performance.now() - t0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95Ms = sorted.length ? sorted[Math.floor(0.95 * (sorted.length - 1))] ?? sorted[sorted.length - 1] : 0;

  return { concurrentTasks: n, totalDurationMs, failures, p95Ms };
}
