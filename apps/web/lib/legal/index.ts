export {
  LEGAL_DOCUMENT_TYPES,
  REQUIRED_FOR_PLATFORM,
  REQUIRED_FOR_BNHUB_HOST,
  LEGAL_PATHS,
} from "./constants";
export type { LegalDocumentType } from "./constants";
export {
  getActiveDocument,
  getDocumentByVersion,
  getAllActiveDocuments,
  createOrUpdateDocument,
  getAcceptanceStats,
} from "./documents";
export type { LegalDocumentRecord } from "./documents";
export {
  getUserAcceptance,
  getRequiredAcceptancesForUser,
  hasAcceptedRequired,
  recordAcceptance,
  ACCEPTANCE_ROUTE,
  BNHUB_HOST_AGREEMENT_ROUTE,
} from "./acceptance";
export type { AcceptanceStatus } from "./acceptance";
export {
  requirePlatformAcceptance,
  requireBnhubHostAgreement,
} from "./require-acceptance";
