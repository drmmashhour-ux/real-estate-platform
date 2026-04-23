export type AiCeoLogLevel = "info" | "warn" | "error";

export function aiCeoLog(level: AiCeoLogLevel, event: string, payload?: Record<string, unknown>): void {
  const line = {
    ts: new Date().toISOString(),
    subsystem: "ai_ceo",
    level,
    event,
    ...payload,
  };
  if (level === "error") console.error(JSON.stringify(line));
  else if (level === "warn") console.warn(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}
