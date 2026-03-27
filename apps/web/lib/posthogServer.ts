/**
 * Server-side PostHog — re-exports shared helpers.
 * Prefer `POSTHOG_API_KEY` + `POSTHOG_HOST` in production; falls back to `NEXT_PUBLIC_*` when unset.
 */
export { captureServerEvent, getPosthogServerClient } from "@/lib/analytics/posthog-server";
