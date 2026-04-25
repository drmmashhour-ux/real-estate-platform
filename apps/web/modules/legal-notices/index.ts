export {
  getLegalNotice,
  getLegalNoticeTitleAndBody,
  LegalNoticeContentLibrary,
} from "./legalNoticeContent";
export type { LegalNoticeEntry, LegalNoticeKey, LegalNoticeSeverity } from "./legalNoticeContent";
export {
  formatLegalNoticeHtmlBlock,
  formatLegalNoticePlainText,
  formatLegalNoticesHtmlDocumentSection,
  formatLegalNoticesPlainDocumentSection,
} from "./legalNoticeInjection";
export type { LegalDocumentSurface } from "./legalNoticeInjection";
