/**
 * Cohort-level routing readiness — internal advisory; no behavior change.
 */

import { prisma } from "@/lib/db";
import type { LeadRoutingReadiness } from "./broker-routing.types";

export async function buildLeadRoutingReadiness(): Promise<LeadRoutingReadiness> {
  const totalRoutableBrokers = await prisma.user.count({ where: { role: "BROKER" } });

  const routingNotes: string[] = [
    "Per-lead routing quality is evaluated on demand — no batch auto-assignment in V1.",
    "Use candidate lists as decision support only; brokers are never blocked by routing score.",
  ];

  if (totalRoutableBrokers < 5) {
    routingNotes.push("Small broker pool — wait for scale before cohort routing experiments.");
  }

  return {
    totalRoutableBrokers,
    routingNotes,
    experimentsAdvisable: totalRoutableBrokers >= 10,
  };
}
