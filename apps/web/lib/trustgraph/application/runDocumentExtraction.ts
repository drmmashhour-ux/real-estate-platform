import {
  runMortgageFileExtractionPipeline,
  runSellerDocumentExtractionPipeline,
} from "@/lib/trustgraph/infrastructure/services/documentExtractionService";

export async function runDocumentExtractionForSellerDocument(args: {
  fsboListingId: string;
  sellerDocumentId: string;
  storageRef: string;
  category: string;
  fileName: string;
}) {
  return runSellerDocumentExtractionPipeline(args);
}

export async function runDocumentExtractionForMortgageFile(args: { mortgageRequestId: string }) {
  return runMortgageFileExtractionPipeline(args);
}
