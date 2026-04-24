/**
 * Internal API layer — domain services consumed by App Router routes and workers.
 * Keep free of HTTP; routes handle auth and telemetry.
 */

export * from "./types";
export * from "./leads";
export * from "./deals";
export * from "./messaging";
export * from "./analytics";
