/**
 * Lightweight lead → broker-prospect assignment log (additive; CRM Lead is source of truth).
 * Optional JSON persistence via BROKER_LEAD_ASSIGNMENTS_JSON_PATH.
 */

import fs from "fs";
import path from "path";
import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";
import { listBrokerPipeline } from "@/modules/brokers/broker-pipeline.service";
import { updateBrokerPerformance } from "@/modules/brokers/broker-performance.service";
import { prisma } from "@/lib/db";

export type LeadAssignment = {
  id: string;
  leadId: string;
  brokerProspectId: string;
  assignedAt: string;
  unlocked: boolean;
  unlockedAt?: string;
  /** Why this match was chosen (for ops explainability). */
  matchReason: string;
};

const assignments = new Map<string, LeadAssignment>();

function assignmentsFile(): string | null {
  const raw = process.env.BROKER_LEAD_ASSIGNMENTS_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function loadAssignments(): void {
  const fp = assignmentsFile();
  if (!fp || !fs.existsSync(fp)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(fp, "utf8")) as unknown;
    if (!Array.isArray(raw)) return;
    assignments.clear();
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.leadId !== "string" || typeof r.brokerProspectId !== "string") continue;
      assignments.set(r.leadId, {
        id: r.id,
        leadId: r.leadId,
        brokerProspectId: r.brokerProspectId,
        assignedAt: typeof r.assignedAt === "string" ? r.assignedAt : new Date().toISOString(),
        unlocked: r.unlocked === true,
        unlockedAt: typeof r.unlockedAt === "string" ? r.unlockedAt : undefined,
        matchReason: typeof r.matchReason === "string" ? r.matchReason : "",
      });
    }
  } catch {
    /* ignore */
  }
}

function persistAssignments(): void {
  const fp = assignmentsFile();
  if (!fp) return;
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, JSON.stringify([...assignments.values()], null, 2), "utf8");
  } catch {
    /* read-only deploy */
  }
}

let loaded = false;
function ensureAssignmentsLoaded(): void {
  if (loaded) return;
  loaded = true;
  loadAssignments();
}

function normalizeRegion(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/** Prefer brokers in demo/converted with matching territoryRegion; else first onboarded-stage broker; else random eligible. */
export function pickBrokerProspectForLead(regionHint: string | null): {
  prospect: BrokerProspect | null;
  matchReason: string;
} {
  const prospects = listBrokerPipeline();
  const onboardedStages = new Set<BrokerProspect["stage"]>(["replied", "demo", "converted"]);
  const eligible = prospects.filter((p) => onboardedStages.has(p.stage));
  const region = normalizeRegion(regionHint);

  if (region && eligible.length > 0) {
    const territoryMatch = eligible.filter((p) => normalizeRegion(p.territoryRegion) === region);
    if (territoryMatch.length > 0) {
      const idx = Math.floor(Math.random() * territoryMatch.length);
      return {
        prospect: territoryMatch[idx]!,
        matchReason: `Territory match (${regionHint})`,
      };
    }
  }

  if (eligible.length > 0) {
    const idx = Math.floor(Math.random() * eligible.length);
    return {
      prospect: eligible[idx]!,
      matchReason: region ? "No territory match — assigned among onboarded brokers" : "Assigned among onboarded brokers",
    };
  }

  const fallback = prospects.filter((p) => p.stage !== "lost");
  if (fallback.length > 0) {
    const idx = Math.floor(Math.random() * fallback.length);
    return {
      prospect: fallback[idx]!,
      matchReason: "Fallback — no onboarded brokers; picked active non-lost prospect",
    };
  }

  return { prospect: null, matchReason: "No prospects in pipeline" };
}

/**
 * Record an assignment when a CRM lead appears / is routed (call from ingestion or admin job).
 * Idempotent per leadId — returns existing assignment if present.
 */
export function assignLeadToBrokerProspect(input: {
  leadId: string;
  purchaseRegion?: string | null;
}): LeadAssignment | null {
  ensureAssignmentsLoaded();
  const existing = assignments.get(input.leadId);
  if (existing) return existing;

  const { prospect, matchReason } = pickBrokerProspectForLead(input.purchaseRegion ?? null);
  if (!prospect) return null;

  const row: LeadAssignment = {
    id: crypto.randomUUID(),
    leadId: input.leadId,
    brokerProspectId: prospect.id,
    assignedAt: new Date().toISOString(),
    unlocked: false,
    matchReason,
  };
  assignments.set(input.leadId, row);
  updateBrokerPerformance(prospect.id, "lead_received");
  persistAssignments();
  return row;
}

/** Load lead region from DB and assign (server-only). */
export async function assignLeadFromCrmLeadId(leadId: string): Promise<LeadAssignment | null> {
  ensureAssignmentsLoaded();
  if (assignments.has(leadId)) return assignments.get(leadId)!;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, purchaseRegion: true, message: true },
  });
  if (!lead) return null;

  const region = lead.purchaseRegion?.trim() || extractCityGuessFromMessage(lead.message);
  return assignLeadToBrokerProspect({ leadId: lead.id, purchaseRegion: region });
}

function extractCityGuessFromMessage(message: string): string | null {
  const m = message.match(/\b(Montreal|Montréal|Quebec|Québec|Laval|Gatineau)\b/i);
  return m?.[1] ?? null;
}

export function markLeadAssignmentUnlocked(leadId: string): LeadAssignment | null {
  ensureAssignmentsLoaded();
  const row = assignments.get(leadId);
  if (!row || row.unlocked) return row ?? null;
  const next: LeadAssignment = {
    ...row,
    unlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  assignments.set(leadId, next);
  persistAssignments();
  return next;
}

export function listLeadAssignments(): LeadAssignment[] {
  ensureAssignmentsLoaded();
  return [...assignments.values()].sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));
}

/** @internal tests */
export function __resetLeadAssignmentsForTests(): void {
  loaded = true;
  assignments.clear();
}
