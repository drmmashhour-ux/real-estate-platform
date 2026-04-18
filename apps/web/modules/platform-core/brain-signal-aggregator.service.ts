/**
 * One Brain V3 — outcome → durable cross-domain signals (additive; gated by flags).
 */
import { prisma } from "@/lib/db";
import { oneBrainV3Flags } from "@/config/feature-flags";
import { propagateSignalAcrossDomains } from "./brain-cross-domain.service";
import { computeSignalDurability } from "./brain-signal-durability.service";
import { outcomeEvidenceHint, validateNegativeSignal } from "./brain-negative-signal.service";
import { setBrainV3RuntimeSnapshot } from "./brain-v3-runtime-cache";
import type { CoreEntityType } from "./platform-core.types";
import type {
  BrainCrossDomainImpact,
  BrainOutcomeRecord,
  BrainSignalDirection,
  CrossDomainLearningSignal,
} from "./brain-v2.types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function directionFromOutcome(o: BrainOutcomeRecord): BrainSignalDirection {
  if (o.outcomeType === "POSITIVE") return "POSITIVE";
  if (o.outcomeType === "NEGATIVE") return "NEGATIVE";
  return "NEUTRAL";
}

function groupKey(o: BrainOutcomeRecord): string {
  return `${o.source}:${o.entityId ?? "none"}`;
}

function toCoreEntity(t: string): CoreEntityType | undefined {
  const allowed: CoreEntityType[] = [
    "CAMPAIGN",
    "LISTING",
    "EXPERIMENT",
    "VARIANT",
    "MESSAGE",
    "SURFACE",
    "UNKNOWN",
  ];
  return allowed.includes(t as CoreEntityType) ? (t as CoreEntityType) : undefined;
}

/**
 * Converts recent outcomes into normalized signals, applies optional negative filter + durability, persists, propagates.
 */
export async function buildCrossDomainSignalsFromOutcomes(
  outcomes: BrainOutcomeRecord[],
): Promise<{
  signals: CrossDomainLearningSignal[];
  impacts: BrainCrossDomainImpact[];
  notes: string[];
  persistedSignals: number;
}> {
  const notes: string[] = [];
  if (!oneBrainV3Flags.oneBrainV3CrossDomainV1 && !oneBrainV3Flags.oneBrainV3DurabilityV1 && !oneBrainV3Flags.oneBrainV3NegativeFilterV1) {
    notes.push("Brain V3 flags off — skipping cross-domain aggregation.");
    return { signals: [], impacts: [], notes, persistedSignals: 0 };
  }

  const usable = outcomes.filter((o) => o.outcomeType !== "INSUFFICIENT_DATA");
  const groups = new Map<string, BrainOutcomeRecord[]>();
  for (const o of usable) {
    const k = groupKey(o);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(o);
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const signals: CrossDomainLearningSignal[] = [];
  const impacts: BrainCrossDomainImpact[] = [];
  const guardNotes: string[] = [];
  let persistedSignals = 0;

  for (const [, arr] of groups) {
    const latest = arr[arr.length - 1]!;
    const obs = arr.map((o) => ({
      direction: directionFromOutcome(o),
      createdAt: o.createdAt,
      magnitude: clamp01(Math.abs(o.outcomeScore)),
    }));

    const durability =
      oneBrainV3Flags.oneBrainV3DurabilityV1 ?
        computeSignalDurability(obs)
      : { stabilityScore: 0.5, decayFactor: 0.92, confidence: 0.45 };

    const et = toCoreEntity(latest.entityType);
    const preliminary: CrossDomainLearningSignal = {
      source: latest.source as CrossDomainLearningSignal["source"],
      entityId: latest.entityId ?? undefined,
      ...(et ? { entityType: et } : {}),
      direction: directionFromOutcome(latest),
      magnitude: clamp01(Math.abs(latest.outcomeScore)),
      durability,
      reason: latest.reason,
      metadata: {
        evidenceScore: outcomeEvidenceHint(latest),
        decisionId: latest.decisionId,
        groupSize: arr.length,
      },
      createdAt: latest.createdAt,
    };

    let finalSignal = preliminary;
    if (oneBrainV3Flags.oneBrainV3NegativeFilterV1 && preliminary.direction === "NEGATIVE") {
      const v = validateNegativeSignal(preliminary, usable);
      finalSignal = v.signal;
      if (v.guardLowQuality && v.guardReason) {
        guardNotes.push(`${preliminary.source}/${preliminary.entityId ?? "—"}: ${v.guardReason}`);
        try {
          const existing = await prisma.brainNegativeSignalGuard.findFirst({
            where: {
              source: String(preliminary.source),
              entityId: preliminary.entityId ?? null,
            },
          });
          if (existing) {
            await prisma.brainNegativeSignalGuard.update({
              where: { id: existing.id },
              data: {
                signalCount: { increment: 1 },
                lastSignalAt: new Date(),
                reason: v.guardReason,
              },
            });
          } else {
            await prisma.brainNegativeSignalGuard.create({
              data: {
                source: String(preliminary.source),
                entityId: preliminary.entityId ?? undefined,
                signalCount: 1,
                lastSignalAt: new Date(),
                blocked: false,
                reason: v.guardReason,
              },
            });
          }
        } catch {
          /* ignore guard persistence errors */
        }
      }
    }

    signals.push(finalSignal);

    if (oneBrainV3Flags.oneBrainV3CrossDomainV1) {
      impacts.push(...propagateSignalAcrossDomains(finalSignal));
    }

    if (oneBrainV3Flags.oneBrainV3CrossDomainV1 || oneBrainV3Flags.oneBrainV3DurabilityV1) {
      try {
        await prisma.brainCrossDomainSignal.create({
          data: {
            source: String(finalSignal.source),
            entityId: finalSignal.entityId ?? undefined,
            entityType: finalSignal.entityType != null ? String(finalSignal.entityType) : undefined,
            direction: finalSignal.direction,
            magnitude: finalSignal.magnitude,
            stability: finalSignal.durability.stabilityScore,
            decayFactor: finalSignal.durability.decayFactor,
            confidence: finalSignal.durability.confidence,
            metadata: {
              reason: finalSignal.reason,
              ...(finalSignal.metadata as object),
            } as object,
          },
        });
        persistedSignals += 1;
      } catch {
        /* best-effort persistence */
      }
    }
  }

  if (signals.length > 0) {
    setBrainV3RuntimeSnapshot({ signals, impacts, guardNotes });
  }

  notes.push(
    `Brain V3: ${signals.length} grouped signal(s), ${impacts.length} cross-domain impact edge(s), ${persistedSignals} row(s) persisted.`,
  );
  return { signals, impacts, notes, persistedSignals };
}
