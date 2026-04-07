import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyDbError } from "@/lib/db/db-error-classification";
import type { AgentKey, AutopilotMode } from "@/lib/ai/types";
import { AUTOPILOT_MODES } from "@/lib/ai/types";

const SETTINGS_TTL_MS = 15_000;
const SETTINGS_ERROR_TTL_MS = 5_000;
const SETTINGS_CACHE_KEY = "__lecipmManagerAiPlatformSettings";

type SettingsCache = { expires: number; value: ManagerAiSettingsRow };

function envAutonomyHardKill(): boolean {
  const v = process.env.LECIPM_AI_AUTONOMY_KILL_SWITCH?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function readSettingsCache(): ManagerAiSettingsRow | undefined {
  const g = globalThis as unknown as Record<string, SettingsCache | undefined>;
  const hit = g[SETTINGS_CACHE_KEY];
  if (hit && hit.expires > Date.now()) return hit.value;
  return undefined;
}

function writeSettingsCache(value: ManagerAiSettingsRow, ttlMs: number) {
  const g = globalThis as unknown as Record<string, SettingsCache | undefined>;
  g[SETTINGS_CACHE_KEY] = { expires: Date.now() + ttlMs, value };
}

function clearSettingsCache() {
  const g = globalThis as unknown as Record<string, SettingsCache | undefined>;
  delete g[SETTINGS_CACHE_KEY];
}

const AUTONOMY_SAFE_OFF: ManagerAiSettingsRow = {
  globalMode: "ASSIST_ONLY",
  automationsEnabled: false,
  agentModes: {},
  notifyOnApproval: true,
  globalKillSwitch: true,
  domainKillSwitchesJson: null,
  autonomyPausedUntil: null,
};

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
  if (envAutonomyHardKill()) {
    return { ...AUTONOMY_SAFE_OFF };
  }

  const cached = readSettingsCache();
  if (cached) return cached;

  try {
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
    const result: ManagerAiSettingsRow = {
      globalMode,
      automationsEnabled: row?.automationsEnabled ?? true,
      agentModes,
      notifyOnApproval: row?.notifyOnApproval ?? true,
      globalKillSwitch: row?.globalKillSwitch ?? false,
      domainKillSwitchesJson: row?.domainKillSwitchesJson ?? null,
      autonomyPausedUntil: row?.autonomyPausedUntil ?? null,
    };
    writeSettingsCache(result, SETTINGS_TTL_MS);
    return result;
  } catch (err) {
    const c = classifyDbError(err);
    console.warn(
      JSON.stringify({
        event: "manager_ai_platform_settings_db_fallback",
        dbErrorKind: c.kind,
        prismaCode: c.code ?? null,
        messageSummary: c.summary,
      })
    );
    writeSettingsCache(AUTONOMY_SAFE_OFF, SETTINGS_ERROR_TTL_MS);
    return { ...AUTONOMY_SAFE_OFF };
  }
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
  clearSettingsCache();
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
