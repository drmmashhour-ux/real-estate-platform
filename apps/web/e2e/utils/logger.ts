/** Structured E2E tracing for CI and local launch validation. */

export function e2eScenarioStart(id: number, name: string, extra?: Record<string, unknown>): void {
  if (extra && Object.keys(extra).length > 0) {
    console.log("[E2E] scenario start:", `S${id}`, name, extra);
  } else {
    console.log("[E2E] scenario start:", `S${id}`, name);
  }
}

export function e2eStep(stepName: string, detail?: Record<string, unknown>): void {
  if (detail && Object.keys(detail).length > 0) {
    console.log("[E2E] step:", stepName, detail);
  } else {
    console.log("[E2E] step:", stepName);
  }
}

export function e2eAssertionPassed(label: string, detail?: Record<string, unknown>): void {
  if (detail && Object.keys(detail).length > 0) {
    console.log("[E2E] assertion passed:", label, detail);
  } else {
    console.log("[E2E] assertion passed:", label);
  }
}

export function e2eError(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.log("[E2E] error:", context, msg);
}
