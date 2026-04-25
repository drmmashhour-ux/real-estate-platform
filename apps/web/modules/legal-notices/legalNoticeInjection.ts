/**
 * Plain-text and HTML fragments for draft preview, final documents, and PDF export.
 * Escape user-controlled HTML when wrapping in `legalNoticeHtmlDocumentSection`.
 */
import type { LegalNoticeKey } from "./legalNoticeContent";
import { getLegalNoticeTitleAndBody } from "./legalNoticeContent";

export type LegalDocumentSurface = "draft_preview" | "final_document" | "pdf_export";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Single notice as plain text (e.g. append to contract PDF text layer). */
export function formatLegalNoticePlainText(key: LegalNoticeKey, locale: "fr" | "en" = "fr"): string {
  const { title, body } = getLegalNoticeTitleAndBody(key, locale);
  return `${title}\n\n${body}\n`;
}

/**
 * Block suitable for static HTML / print CSS (embed before signature blocks).
 * `surface` is for future analytics; content is the same unless you branch later.
 */
export function formatLegalNoticeHtmlBlock(
  key: LegalNoticeKey,
  locale: "fr" | "en" = "fr",
  _surface: LegalDocumentSurface = "final_document",
): string {
  const { title, body } = getLegalNoticeTitleAndBody(key, locale);
  const t = escapeHtml(title);
  const b = escapeHtml(body).replace(/\n/g, "<br />");
  return `<aside class="lecipm-legal-notice" data-notice-key="${key}" lang="${locale}"><h3 class="lecipm-legal-notice__title">${t}</h3><p class="lecipm-legal-notice__body">${b}</p></aside>`;
}

/** Multiple notices in document order, separated by a horizontal rule in HTML. */
export function formatLegalNoticesHtmlDocumentSection(
  keys: LegalNoticeKey[],
  locale: "fr" | "en" = "fr",
  surface: LegalDocumentSurface = "pdf_export",
): string {
  return keys.map((k) => formatLegalNoticeHtmlBlock(k, locale, surface)).join('<hr class="lecipm-legal-notice-sep" />');
}

export function formatLegalNoticesPlainDocumentSection(keys: LegalNoticeKey[], locale: "fr" | "en" = "fr"): string {
  return keys.map((k) => formatLegalNoticePlainText(k, locale)).join("\n---\n\n");
}
