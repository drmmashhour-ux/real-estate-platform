import { z } from "zod";
import { providerMetadataSchema } from "../providers/types.js";

export const SYRIA_RISK_SIGNAL_TYPES = [
  "duplicate_payment",
  "velocity",
  "suspicious_ip",
  "repeated_failure",
  "provider_anomaly",
] as const;

export const syriaRiskSignalTypeSchema = z.enum(SYRIA_RISK_SIGNAL_TYPES);
export const syriaRiskSeveritySchema = z.enum(["low", "medium", "high"]);

export const riskSignalSchema = z.object({
  type: syriaRiskSignalTypeSchema,
  severity: syriaRiskSeveritySchema,
  subjectId: z.string().trim().min(1),
  correlationId: z.string().trim().min(1),
  metadata: providerMetadataSchema,
});

export type SyriaRiskSignalType = z.infer<typeof syriaRiskSignalTypeSchema>;
export type SyriaRiskSignal = z.infer<typeof riskSignalSchema> & {
  id: string;
  detectedAt: Date;
  passiveMonitoringOnly: true;
};
