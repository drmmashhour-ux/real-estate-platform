export {
  assertCapitalAccess,
  approveLegalDocumentArtifact,
  dispatchLegalDocumentArtifact,
  generateLegalDocumentArtifact,
  getLegalDocumentArtifact,
  listLegalDocumentArtifacts,
  recordInvestmentLegalComplianceApproval,
} from "./legal-documents.service";
export { ensureDefaultTemplates, createTemplateVersion, listTemplatesForAdmin } from "./template-registry.service";
export { legalDocumentsEngineEnabled } from "./legal-documents.domain";
