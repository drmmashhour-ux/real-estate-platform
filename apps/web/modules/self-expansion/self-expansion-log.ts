type Level = "info" | "warn" | "error";

export function selfExpansionLog(level: Level, event: string, payload?: Record<string, unknown>): void {
  const line = {
    ts: new Date().toISOString(),
    subsystem: "self_expansion",
    level,
    event,
    ...payload,
  };
  if (level === "error") console.error(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}
