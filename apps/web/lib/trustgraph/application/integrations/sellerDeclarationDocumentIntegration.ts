import { runSellerDocumentExtractionPipeline } from "@/lib/trustgraph/infrastructure/services/documentExtractionService";

export async function syncDocumentExtractionAfterSellerUpload(args: {
  fsboListingId: string;
  sellerDocumentId: string;
  storageRef: string;
  category: string;
  fileName: string;
}) {
  return runSellerDocumentExtractionPipeline(args);
}
