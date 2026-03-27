import { PostHog } from "posthog-node";
import { logError } from "@/lib/logger";

let serverClient: PostHog | null | undefined;

function getPosthogApiKey(): string | undefined {
  return process.env.POSTHOG_API_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
}

function getPosthogHost(): string {
  return (process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(
    /\/$/,
    ""
  );
}

/** Lazy singleton for advanced server usage (shutdown in tests if needed). */
export function getPosthogServerClient(): PostHog | null {
  return getServerClient();
}

function getServerClient(): PostHog | null {
  if (serverClient !== undefined) return serverClient;
  const key = getPosthogApiKey();
  const host = getPosthogHost();
  if (!key) {
    serverClient = null;
    return null;
  }
  serverClient = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  return serverClient;
}

/** Server-side product analytics (Stripe, Copilot, TrustGraph, etc.). No-op when PostHog is not configured. */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  const client = getServerClient();
  if (!client) return;
  try {
    client.capture({ distinctId, event, properties: properties ?? {} });
  } catch (e) {
    logError("PostHog server capture failed", e);
  }
}
