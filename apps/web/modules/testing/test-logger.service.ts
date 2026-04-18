import type { TunnelStepLog } from "@/modules/testing/test-result.types";

export type TunnelLogger = {
  info: (step: string, message: string, detail?: string) => void;
  warn: (step: string, message: string, detail?: string) => void;
  error: (step: string, message: string, detail?: string) => void;
  getSteps: () => TunnelStepLog[];
  getLogs: () => string[];
};

export function createTunnelLogger(tunnelName: string): TunnelLogger {
  const steps: TunnelStepLog[] = [];
  const lines: string[] = [];

  function push(
    level: TunnelStepLog["level"],
    step: string,
    message: string,
    detail?: string,
  ): void {
    const entry: TunnelStepLog = {
      step,
      at: new Date().toISOString(),
      level,
      message,
      detail,
    };
    steps.push(entry);
    const line = `[${tunnelName}] [${level.toUpperCase()}] ${step}: ${message}${detail ? ` — ${detail}` : ""}`;
    lines.push(line);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.info(line);
    }
  }

  return {
    info: (step, message, detail) => push("info", step, message, detail),
    warn: (step, message, detail) => push("warn", step, message, detail),
    error: (step, message, detail) => push("error", step, message, detail),
    getSteps: () => steps,
    getLogs: () => lines,
  };
}
