import { recordPlatformEvent } from "@/lib/observability";
import {
  isAllowedTrustGraphDocumentMime,
  isAllowedTrustGraphImageMime,
  TRUSTGRAPH_UPLOAD_VALIDATION,
} from "@/lib/trustgraph/upload-validation-config";

export type UploadKind = "image" | "document" | "unknown";

export function classifyUploadKind(mime: string): UploadKind {
  const m = mime.toLowerCase().trim();
  if (m === "image/jpg" || isAllowedTrustGraphImageMime(m)) return "image";
  if (isAllowedTrustGraphDocumentMime(m)) return "document";
  return "unknown";
}

export function assertFsboHubImageMime(mime: string): { ok: true } | { ok: false; userMessage: string } {
  const m = mime.toLowerCase().trim();
  if (m === "image/jpg" || isAllowedTrustGraphImageMime(m)) return { ok: true };
  void recordPlatformEvent({
    eventType: "trustgraph_upload_validation_failed",
    sourceModule: "trustgraph",
    entityType: "UPLOAD",
    entityId: "image",
    payload: { mime: m, reason: "unsupported_image_mime" },
  }).catch(() => {});
  return {
    ok: false,
    userMessage: "Photos must be JPEG, PNG, or WebP.",
  };
}

export function assertFsboHubDocumentMime(mime: string): { ok: true } | { ok: false; userMessage: string } {
  if (isAllowedTrustGraphDocumentMime(mime)) return { ok: true };
  void recordPlatformEvent({
    eventType: "trustgraph_upload_validation_failed",
    sourceModule: "trustgraph",
    entityType: "UPLOAD",
    entityId: "document",
    payload: { mime: mime.toLowerCase(), reason: "unsupported_document_mime" },
  }).catch(() => {});
  return {
    ok: false,
    userMessage: "Documents must be PDF.",
  };
}

export function assertFsboHubFileSizeBytes(size: number): { ok: true } | { ok: false; userMessage: string } {
  if (size <= TRUSTGRAPH_UPLOAD_VALIDATION.maxFileBytes) return { ok: true };
  return {
    ok: false,
    userMessage: `File too large (max ${Math.round(TRUSTGRAPH_UPLOAD_VALIDATION.maxFileBytes / (1024 * 1024))}MB).`,
  };
}
