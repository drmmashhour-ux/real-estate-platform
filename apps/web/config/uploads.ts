/**
 * Upload validation — TrustGraph evidence + FSBO listing photo limits.
 */
export {
  TRUSTGRAPH_UPLOAD_VALIDATION,
  TRUSTGRAPH_UPLOAD_IMAGE_MIMES,
  TRUSTGRAPH_UPLOAD_DOCUMENT_MIMES,
  isAllowedTrustGraphMime,
  isAllowedTrustGraphImageMime,
  isAllowedTrustGraphDocumentMime,
  type TrustgraphAllowedMime,
} from "@/lib/trustgraph/upload-validation-config";

export { getFsboMaxPhotosForSellerPlan, type FsboPhotoType, FSBO_PHOTO_TYPES } from "@/lib/fsbo/photo-limits";
