import type { AutoVideoJob, ScenePreviewCard } from "./auto-video.types";

export function generatePreviewCards(
  job: AutoVideoJob
): ScenePreviewCard[] {
  if (!job.manifest) return [];
  
  return job.manifest.scenes.map(s => ({
    sceneId: s.id,
    kind: s.kind,
    title: s.kind,
    summary: s.textOverlays.map(t => t.text).join(" | "),
  }));
}
