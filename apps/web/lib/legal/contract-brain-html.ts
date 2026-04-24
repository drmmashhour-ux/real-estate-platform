import type { ContractBrainNoticeDefinition } from "@/lib/legal/contract-brain-notices";

/** Marker so injected sections are not duplicated and remain machine-detectable as locked content. */
export const CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER = "<!-- LECIPM_CONTRACT_BRAIN:LIMITED_ROLE_NOTICE:LOCKED -->";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildLimitedRoleNoticeHtmlSection(def: ContractBrainNoticeDefinition): string {
  const safeBody = escapeHtml(def.bodyFr).replace(/\n/g, "<br />");
  return `${CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER}
<section class="lecipm-contract-brain-notice" data-notice-key="${escapeHtml(def.key)}" data-contract-brain-locked="true" lang="fr">
  <h2 class="lecipm-contract-brain-notice__title">${escapeHtml(def.title)}</h2>
  <div class="lecipm-contract-brain-notice__body" style="white-space:normal">${safeBody}</div>
</section>`;
}

export function injectLimitedRoleNoticeIntoHtml(html: string, def: ContractBrainNoticeDefinition): string {
  if (html.includes(CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER)) return html;
  const block = buildLimitedRoleNoticeHtmlSection(def);
  return `${block}\n\n${html}`;
}

export function contractHtmlHasLockedLimitedRoleNotice(html: string | null | undefined): boolean {
  if (!html) return false;
  return html.includes(CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER);
}
