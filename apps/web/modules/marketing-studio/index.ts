export { exportMarketingCanvasToDataUrl, triggerDownloadDataUrl, type ExportFormat } from "./export.service";
export { generateStudioMarketingCopy, type StudioAudience, type StudioGeneratedCopy } from "./studio-ai.service";
export {
  applyMarketingTemplate,
  MARKETING_TEMPLATE_LABELS,
  type MarketingTemplateId,
} from "./templates/index";

export * from "./content.types";
export {
  listMarketingContent,
  getMarketingContent,
  createMarketingContent,
  updateMarketingContent,
  deleteMarketingContent,
  importMarketingContentJson,
  exportAllMarketingContentJson,
  __resetMarketingContentForTests,
} from "./content.service";
export { generateVideoScript, fullScriptToCaption } from "./script.service";
export {
  createVideoProject,
  getVideoProject,
  listVideoProjects,
  updateVideoScene,
  updateVideoProjectMeta,
  buildDefaultScenes,
  toVideoRenderPayload,
  deleteVideoProject,
  __resetVideoProjectsForTests,
} from "./video.service";
export {
  listAssets,
  getAsset,
  addAsset,
  updateAsset,
  deleteAsset,
  searchAssets,
  __resetAssetsForTests,
} from "./asset-library.service";
export { buildExportBundle, downloadContentExportBundle } from "./content-export.service";
export { resetStudioStorageKey } from "./studio-local-storage";
