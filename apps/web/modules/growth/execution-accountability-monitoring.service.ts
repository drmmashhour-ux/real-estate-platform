/**
 * Best-effort logging — never throws.
 */

const PREFIX = "[growth:execution-accountability]";

function safeStr(v: unknown): string {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return "";
  }
}

export function recordAccountabilityCompletionLogged(params: {
  surfaceType: string;
  itemId: string;
  userId?: string;
  completed: boolean;
}): void {
  try {
    console.info(
      `${PREFIX} completion surface=${params.surfaceType} item=${params.itemId} user=${params.userId ?? "?"} completed=${params.completed}`,
    );
  } catch {
    /* ignore */
  }
}

export function recordAccountabilitySummaryBuilt(params: {
  totalEntries: number;
  completionRate: number;
  lowData: boolean;
}): void {
  try {
    console.info(
      `${PREFIX} summary entries=${params.totalEntries} rate=${params.completionRate.toFixed(3)} lowData=${params.lowData}`,
    );
  } catch {
    /* ignore */
  }
}

export function recordAccountabilityLowDataTagged(reason: string): void {
  try {
    console.info(`${PREFIX} low-data ${safeStr(reason)}`);
  } catch {
    /* ignore */
  }
}

export function recordAccountabilityInsightsBuilt(count: number): void {
  try {
    console.info(`${PREFIX} insights count=${count}`);
  } catch {
    /* ignore */
  }
}
