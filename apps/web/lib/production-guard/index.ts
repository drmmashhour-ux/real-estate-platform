/**
 * LECIPM ProductionGuard — final production hardening layer (schema lock, signature gate, AI validation, audit, PDF hash).
 */
export * from "./production-mode";
export * from "./critical-notices";
export * from "./formSchema";
export * from "./signature-gate";
export * from "./notice-ack.service";
export * from "./audit-service";
export * from "./ai-output";
export * from "./ai-fallback";
export * from "./pdf-artifact.service";
export * from "./form-type-map";
