/**
 * Deterministic automated demo tour — paths and narration keys only (no user data).
 */

export type DemoScriptNavigateStep = {
  type: "NAVIGATE";
  path: string;
  narration: string;
};

export type DemoScriptWaitStep = {
  type: "WAIT";
  ms: number;
};

export type DemoScriptActionStep = {
  type: "ACTION";
  key: string;
};

export type DemoScriptStep = DemoScriptNavigateStep | DemoScriptWaitStep | DemoScriptActionStep;

/** Fixed sequence: navigation + narration keys match `@/lib/demo/narration-registry`. */
export const demoScript: DemoScriptStep[] = [
  { type: "NAVIGATE", path: "/en/demo", narration: "/demo" },
  { type: "WAIT", ms: 3000 },
  { type: "NAVIGATE", path: "/en/listing/demo-1", narration: "/listing" },
  { type: "WAIT", ms: 3000 },
  { type: "ACTION", key: "ACTION_REQUEST_BOOKING" },
  { type: "WAIT", ms: 3000 },
  { type: "ACTION", key: "ACTION_HOST_CONFIRM" },
  { type: "WAIT", ms: 3000 },
  { type: "ACTION", key: "ACTION_PAYMENT_BLOCKED" },
  { type: "WAIT", ms: 3000 },
  { type: "NAVIGATE", path: "/en/admin/dr-brain", narration: "/admin/dr-brain" },
];
