import { runMortgageFileExtractionPipeline } from "@/lib/trustgraph/infrastructure/services/documentExtractionService";

export async function syncMortgageDocumentExtraction(args: { mortgageRequestId: string }) {
  return runMortgageFileExtractionPipeline(args);
}
