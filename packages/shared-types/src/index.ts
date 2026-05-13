import { randomUUID } from "node:crypto";

export type NexoraEnvironment = "development" | "staging" | "production";

export interface ApiEnvelope<T> {
  ok: boolean;
  correlationId: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ServiceHealth {
  service: string;
  status: "ok";
  environment: NexoraEnvironment;
  livePaymentsEnabled: false;
  checkedAt: string;
}

export interface LoggerContext {
  service: string;
  environment: NexoraEnvironment;
  correlationId: string;
}

const LIVE_ENV_KEYS = [
  "LIVE_PAYMENTS_ENABLED",
  "PAYMENT_LIVE_MODE",
  "REAL_MONEY_ENABLED",
  "STRIPE_SECRET_KEY",
  "VISA_API_KEY",
  "MASTERCARD_API_KEY",
  "BANK_API_KEY",
] as const;

export function createCorrelationId(): string {
  return randomUUID();
}

export function resolveEnvironment(value = process.env["NEXORA_ENV"] ?? "development"): NexoraEnvironment {
  if (value === "development" || value === "staging" || value === "production") return value;
  throw new Error("NEXORA_ENV must be development, staging, or production.");
}

export function assertSafeRuntimeConfig(env: NodeJS.ProcessEnv = process.env): NexoraEnvironment {
  const environment = resolveEnvironment(env["NEXORA_ENV"] ?? "development");
  const unsafeKeys = LIVE_ENV_KEYS.filter((key) => {
    const value = env[key]?.trim();
    if (!value) return false;
    return true;
  });
  if (unsafeKeys.length > 0) {
    throw new Error(`Unsafe live payment configuration rejected: ${unsafeKeys.join(", ")}.`);
  }
  return environment;
}

export function createHealth(service: string, environment: NexoraEnvironment): ServiceHealth {
  return {
    service,
    status: "ok",
    environment,
    livePaymentsEnabled: false,
    checkedAt: new Date().toISOString(),
  };
}

export class StructuredLogger {
  constructor(private readonly base: Omit<LoggerContext, "correlationId">) {}

  info(correlationId: string, message: string, metadata: Record<string, unknown> = {}): void {
    this.write("info", correlationId, message, metadata);
  }

  error(correlationId: string, message: string, metadata: Record<string, unknown> = {}): void {
    this.write("error", correlationId, message, metadata);
  }

  private write(
    level: "info" | "error",
    correlationId: string,
    message: string,
    metadata: Record<string, unknown>,
  ): void {
    console.log(
      JSON.stringify({
        level,
        service: this.base.service,
        environment: this.base.environment,
        correlationId,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

export function ok<T>(correlationId: string, data: T): ApiEnvelope<T> {
  return { ok: true, correlationId, data };
}

export function fail(correlationId: string, code: string, message: string): ApiEnvelope<never> {
  return { ok: false, correlationId, error: { code, message } };
}
