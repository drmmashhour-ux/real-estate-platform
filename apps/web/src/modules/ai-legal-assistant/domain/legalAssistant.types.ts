import type { LegalAssistantIntent } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.enums";

export type LegalAssistantResponse = {
  intent: LegalAssistantIntent;
  summary: string;
  keyPoints: string[];
  warnings: string[];
  recommendedActions: string[];
  confidence: number;
  sourceSections: string[];
  actionDrafts?: Array<{ type: string; label: string; payload: Record<string, unknown> }>;
};

export type LegalAssistantContext = {
  documentId: string;
  status: string;
  payload: Record<string, unknown>;
  validation: {
    completenessPercent: number;
    missingFields: string[];
    contradictionFlags: string[];
    warningFlags: string[];
    sectionStatuses: Array<{ sectionKey: string; ready: boolean; missing: string[] }>;
  };
  audit: Array<{ id: string; actionType: string; actorUserId: string; metadata?: Record<string, unknown> | null; createdAt: Date | string }>;
  signatures: Array<{ id: string; signerName: string; signerEmail: string; status: string; signedAt: Date | null }>;
  versions: Array<{ id: string; versionNumber: number; createdAt: Date | string }>;
  knowledge: string[];
};
