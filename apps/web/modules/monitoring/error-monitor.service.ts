/**
 * Central error capture facade — Sentry is wired via `sentry.*.config.ts`; this layer is for typed metadata.
 */
import * as Sentry from "@sentry/nextjs";
import { triggerAlert } from "@/modules/alerts/alert.service";

export async function captureApiFailure(input: {
  route: string;
  message: string;
  cause?: unknown;
  /** Non-PII */
  meta?: Record<string, unknown>;
}): Promise<void> {
  Sentry.captureException(input.cause ?? new Error(input.message), {
    tags: { route: input.route },
    extra: input.meta,
  });
  await triggerAlert({
    type: "server_error",
    severity: "warning",
    message: `${input.route}: ${input.message}`,
    meta: { route: input.route, ...input.meta },
  });
}
