import { prisma } from "@/lib/db";

export type AutonomyDomain = 
  | "pricing"
  | "learning"
  | "actions"
  | "portfolio_allocator"
  | "outbound_marketing"
  | "recommendations";

export type DomainStatus = {
  domain: AutonomyDomain;
  isEnabled: boolean;
  reason?: string;
  changedBy?: string;
  changedAt?: Date;
};

export async function getDomainKillSwitches(): Promise<DomainStatus[]> {
  const govState = await prisma.managerAiAutonomyGovernanceState.findUnique({
    where: { id: "singleton" },
  });

  if (!govState) {
    // Return defaults if state doesn't exist yet
    return [
      { domain: "pricing", isEnabled: true },
      { domain: "learning", isEnabled: true },
      { domain: "actions", isEnabled: true },
      { domain: "portfolio_allocator", isEnabled: true },
      { domain: "outbound_marketing", isEnabled: true },
      { domain: "recommendations", isEnabled: true },
    ];
  }

  const activeDomains = govState.activeDomainsJson as Record<string, any>;
  
  return [
    "pricing", "learning", "actions", "portfolio_allocator", "outbound_marketing", "recommendations"
  ].map((d) => ({
    domain: d as AutonomyDomain,
    isEnabled: activeDomains[d]?.enabled ?? true,
    reason: activeDomains[d]?.reason,
    changedBy: activeDomains[d]?.changedBy,
    changedAt: activeDomains[d]?.changedAt ? new Date(activeDomains[d]?.changedAt) : undefined,
  }));
}

export async function toggleDomainKillSwitch(
  domain: AutonomyDomain,
  isEnabled: boolean,
  userId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const govState = await prisma.managerAiAutonomyGovernanceState.findUnique({
      where: { id: "singleton" },
    });

    const activeDomains = (govState?.activeDomainsJson as Record<string, any>) || {};
    
    activeDomains[domain] = {
      enabled: isEnabled,
      reason,
      changedBy: userId,
      changedAt: new Date().toISOString(),
    };

    await prisma.managerAiAutonomyGovernanceState.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        mode: "ASSIST",
        activeDomainsJson: activeDomains,
      },
      update: {
        activeDomainsJson: activeDomains,
      },
    });

    // Log the kill switch toggle
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "KILL_SWITCH_TOGGLED",
        actorUserId: userId,
        payloadJson: {
          domain,
          isEnabled,
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return { ok: true };
  } catch (error) {
    console.error(`Failed to toggle kill switch for ${domain}`, error);
    return { ok: false, error: "internal_server_error" };
  }
}

export async function updateAutonomyMode(
  mode: string,
  userId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.managerAiAutonomyGovernanceState.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        mode,
        activeDomainsJson: {},
      },
      update: {
        mode,
      },
    });

    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "MODE_CHANGED",
        actorUserId: userId,
        payloadJson: {
          newMode: mode,
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return { ok: true };
  } catch (error) {
    console.error(`Failed to update autonomy mode to ${mode}`, error);
    return { ok: false, error: "internal_server_error" };
  }
}
