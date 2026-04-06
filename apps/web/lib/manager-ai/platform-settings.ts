import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AgentKey, AutopilotMode } from "@/lib/ai/types";
import { AUTOPILOT_MODES } from "@/lib/ai/types";

function isAutopilotMode(s: string): s is AutopilotMode {
  return (AUTOPILOT_MODES as readonly string[]).includes(s);
}

export type ManagerAiSettingsRow = {
  globalMode: AutopilotMode;
  automationsEnabled: boolean;
  agentModes: Partial<Record<AgentKey, AutopilotMode>>;
  notifyOnApproval: boolean;
  globalKillSwitch: boolean;
  domainKillSwitchesJson: unknown;
  autonomyPausedUntil: Date | null;
};

export async function getManagerAiPlatformSettings(): Promise<ManagerAiSettingsRow> {
  const row = await prisma.managerAiPlatformSettings.findUnique({ where: { id: "default" } });
  const raw = row?.agentModesJson as Record<string, string> | null | undefined;
  const agentModes: Partial<Record<AgentKey, AutopilotMode>> = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && isAutopilotMode(v)) {
        agentModes[k as AgentKey] = v;
      }
    }
  }
  const globalMode = row?.globalMode && isAutopilotMode(row.globalMode) ? row.globalMode : "ASSISTANT";
  return {
    globalMode,
    automationsEnabled: row?.automationsEnabled ?? true,
    agentModes,
    notifyOnApproval: row?.notifyOnApproval ?? true,
    globalKillSwitch: row?.globalKillSwitch ?? false,
    domainKillSwitchesJson: row?.domainKillSwitchesJson ?? null,
    autonomyPausedUntil: row?.autonomyPausedUntil ?? null,
  };
}

export async function updateManagerAiPlatformSettings(data: {
  globalMode?: AutopilotMode;
  automationsEnabled?: boolean;
  agentModesJson?: Record<string, AutopilotMode>;
  notifyOnApproval?: boolean;
  globalKillSwitch?: boolean;
  domainKillSwitchesJson?: Record<string, boolean> | null;
  autonomyPausedUntil?: Date | null;
}) {
  return prisma.managerAiPlatformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      globalMode: data.globalMode ?? "ASSISTANT",
      automationsEnabled: data.automationsEnabled ?? true,
      agentModesJson: data.agentModesJson as object | undefined,
      notifyOnApproval: data.notifyOnApproval ?? true,
      globalKillSwitch: data.globalKillSwitch ?? false,
      domainKillSwitchesJson:
        data.domainKillSwitchesJson === undefined
          ? undefined
          : data.domainKillSwitchesJson === null
            ? Prisma.JsonNull
            : (data.domainKillSwitchesJson as Prisma.InputJsonValue),
      autonomyPausedUntil: data.autonomyPausedUntil ?? undefined,
    },
    update: {
      ...(data.globalMode ? { globalMode: data.globalMode } : {}),
      ...(data.automationsEnabled !== undefined ? { automationsEnabled: data.automationsEnabled } : {}),
      ...(data.agentModesJson !== undefined ? { agentModesJson: data.agentModesJson as object } : {}),
      ...(data.notifyOnApproval !== undefined ? { notifyOnApproval: data.notifyOnApproval } : {}),
      ...(data.globalKillSwitch !== undefined ? { globalKillSwitch: data.globalKillSwitch } : {}),
      ...(data.domainKillSwitchesJson !== undefined
        ? {
            domainKillSwitchesJson:
              data.domainKillSwitchesJson === null
                ? Prisma.JsonNull
                : (data.domainKillSwitchesJson as Prisma.InputJsonValue),
          }
        : {}),
      ...(data.autonomyPausedUntil !== undefined ? { autonomyPausedUntil: data.autonomyPausedUntil } : {}),
    },
  });
}
