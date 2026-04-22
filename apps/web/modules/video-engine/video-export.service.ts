import { prisma } from "@/lib/db";

import type { VideoRenderManifestVm } from "./video-engine.types";

export type VideoExportBundleVm = {
  projectId: string;
  status: string;
  renderManifest: VideoRenderManifestVm;
  mediaPackage: unknown;
  suggestedCaption: string;
  hashtagsLine: string;
};

export async function saveProjectExportPayload(
  projectId: string,
  bundle: Omit<VideoExportBundleVm, "projectId">,
): Promise<void> {
  await prisma.lecipmVideoEngineProject.update({
    where: { id: projectId },
    data: {
      renderManifestJson: bundle.renderManifest as object,
      mediaPackageJson: bundle.mediaPackage === undefined ? undefined : (bundle.mediaPackage as object),
      status: bundle.status,
    },
  });
}

export async function transitionVideoProjectStatus(
  projectId: string,
  next:
    | "draft"
    | "preview"
    | "approved"
    | "scheduled"
    | "published"
    | "rejected",
  opts?: { rejectionReason?: string; scheduledAt?: Date },
): Promise<void> {
  await prisma.lecipmVideoEngineProject.update({
    where: { id: projectId },
    data: {
      status: next,
      ...(next === "rejected"
        ? { rejectionReason: opts?.rejectionReason?.slice(0, 2000) ?? null }
        : { rejectionReason: null }),
      ...(next === "scheduled" ? { scheduledAt: opts?.scheduledAt ?? null } : {}),
      ...(next === "published" ? { publishedAt: new Date() } : {}),
    },
  });
}
