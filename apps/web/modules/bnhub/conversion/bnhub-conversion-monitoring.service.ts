import { logInfo } from "@/lib/logger";

const LOG_PREFIX = "[bnhub:conversion]";

type State = {
  eventsTracked: number;
  analyzerRuns: number;
  insightsGenerated: number;
  frictionDetectedCount: number;
};

const state: State = {
  eventsTracked: 0,
  analyzerRuns: 0,
  insightsGenerated: 0,
  frictionDetectedCount: 0,
};

function safeLog(payload: Record<string, unknown>): void {
  try {
    logInfo(LOG_PREFIX, payload);
  } catch {
    /* never throw */
  }
}

export function recordBnhubConversionEventTracked(meta?: Record<string, unknown>): void {
  state.eventsTracked += 1;
  safeLog({ event: "tracked", eventsTracked: state.eventsTracked, ...meta });
}

export function recordBnhubAnalyzerRun(meta?: Record<string, unknown>): void {
  state.analyzerRuns += 1;
  safeLog({ event: "analyzer_run", analyzerRuns: state.analyzerRuns, ...meta });
}

export function recordBnhubInsightsGenerated(n: number, meta?: Record<string, unknown>): void {
  state.insightsGenerated += n;
  safeLog({ event: "insights", count: n, insightsGenerated: state.insightsGenerated, ...meta });
}

export function recordBnhubFrictionDetected(meta?: Record<string, unknown>): void {
  state.frictionDetectedCount += 1;
  safeLog({ event: "friction", frictionDetectedCount: state.frictionDetectedCount, ...meta });
}

export function getBnhubConversionMonitoringSnapshot(): State {
  return { ...state };
}

export function resetBnhubConversionMonitoringForTests(): void {
  state.eventsTracked = 0;
  state.analyzerRuns = 0;
  state.insightsGenerated = 0;
  state.frictionDetectedCount = 0;
}
