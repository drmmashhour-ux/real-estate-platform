import { randomUUID } from "node:crypto";
import type {
  DrBrainAppId,
  DrBrainEnv,
  DrBrainReport,
  DrBrainTicket,
  DrBrainTicketCategory,
  DrBrainTicketSeverity,
  DrBrainTicketStatus,
} from "./types";

export type CreateDrBrainTicketInput = {
  appId: DrBrainAppId;
  appEnv: DrBrainEnv;
  severity: DrBrainTicketSeverity;
  category: DrBrainTicketCategory;
  title: string;
  description: string;
  recommendedActions: string[];
  metadata?: Record<string, unknown>;
};

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

type DedupeSlot = {
  lastAt: number;
  criticalEmittedAt?: number;
  warningHits: number;
  warningTicketIssued?: boolean;
};

const fingerprintDedupe = new Map<string, DedupeSlot>();
const ticketMemoryById = new Map<string, DrBrainTicket>();

function pruneDedupe(now: number): void {
  for (const [k, slot] of fingerprintDedupe) {
    if (now - slot.lastAt > DEDUPE_WINDOW_MS * 2) {
      fingerprintDedupe.delete(k);
    }
  }
}

function stripRiskyKeys(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const bad = /secret|password|token|authorization|apikey|private_key|database_url/i;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (bad.test(key)) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function inferTicketCategory(check: string): DrBrainTicketCategory {
  const c = check.toLowerCase();
  if (c.startsWith("database.") || c.includes("database")) return "DATABASE";
  if (c.startsWith("payments.") || c.includes("payment")) return "PAYMENTS";
  if (c.startsWith("anomalies.") || c.includes("fraud")) return "FRAUD";
  if (c.startsWith("build.") || c.startsWith("performance.")) return "PERFORMANCE";
  if (c.startsWith("security.") || c.startsWith("env.") || c.includes("isolation")) return "SECURITY";
  return "SYSTEM";
}

function fingerprintFor(appId: DrBrainAppId, check: string): string {
  return `${appId}::${check}`;
}

export function createDrBrainTicket(input: CreateDrBrainTicketInput): DrBrainTicket {
  const now = new Date().toISOString();
  const ticket: DrBrainTicket = {
    id: randomUUID(),
    appId: input.appId,
    appEnv: input.appEnv,
    severity: input.severity,
    category: input.category,
    title: input.title.slice(0, 500),
    description: input.description.slice(0, 4000),
    recommendedActions: input.recommendedActions.map((s) => s.slice(0, 2000)).slice(0, 30),
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
    metadata: stripRiskyKeys(input.metadata),
  };
  ticketMemoryById.set(ticket.id, ticket);
  return ticket;
}

export function updateDrBrainTicketInMemory(ticketId: string, status: DrBrainTicketStatus): DrBrainTicket | null {
  const t = ticketMemoryById.get(ticketId);
  if (!t) return null;
  const updated: DrBrainTicket = {
    ...t,
    status,
    updatedAt: new Date().toISOString(),
  };
  ticketMemoryById.set(ticketId, updated);
  return updated;
}

export function getDrBrainTicketFromMemory(ticketId: string): DrBrainTicket | undefined {
  return ticketMemoryById.get(ticketId);
}

export function syncTicketsFromReport(report: DrBrainReport): DrBrainTicket[] {
  const now = Date.now();
  pruneDedupe(now);
  const created: DrBrainTicket[] = [];

  for (const r of report.results) {
    if (r.level === "INFO") continue;
    const fp = fingerprintFor(report.appId, r.check);
    const slot = fingerprintDedupe.get(fp) ?? {
      lastAt: now,
      warningHits: 0,
    };
    slot.lastAt = now;

    if (r.level === "CRITICAL") {
      if (slot.criticalEmittedAt != null && now - slot.criticalEmittedAt < DEDUPE_WINDOW_MS) {
        fingerprintDedupe.set(fp, slot);
        continue;
      }
      slot.criticalEmittedAt = now;
      fingerprintDedupe.set(fp, slot);

      const ticket = createDrBrainTicket({
        appId: report.appId,
        appEnv: report.appEnv,
        severity: "CRITICAL",
        category: inferTicketCategory(r.check),
        title: `[CRITICAL] ${r.check}`,
        description: r.message,
        recommendedActions: report.recommendations.slice(0, 8),
        metadata: stripRiskyKeys({ sourceCheck: r.check, ...(r.metadata ?? {}) }),
      });
      created.push(ticket);
      continue;
    }

    if (r.level === "WARNING") {
      if (slot.warningTicketIssued) {
        fingerprintDedupe.set(fp, slot);
        continue;
      }
      slot.warningHits += 1;
      if (slot.warningHits >= 2) {
        slot.warningTicketIssued = true;
        fingerprintDedupe.set(fp, slot);
        const ticket = createDrBrainTicket({
          appId: report.appId,
          appEnv: report.appEnv,
          severity: "WARNING",
          category: inferTicketCategory(r.check),
          title: `[WARNING×2] ${r.check}`,
          description: r.message,
          recommendedActions: report.recommendations.slice(0, 8),
          metadata: stripRiskyKeys({ sourceCheck: r.check, warningsSeen: slot.warningHits }),
        });
        created.push(ticket);
      } else {
        fingerprintDedupe.set(fp, slot);
      }
    }
  }

  return created;
}
