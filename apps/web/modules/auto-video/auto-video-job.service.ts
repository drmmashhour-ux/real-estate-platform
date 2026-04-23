import type {
  AutoVideoJob,
  AutoVideoJobStatus,
  AutoVideoRequest,
  AutoVideoScene,
} from "./auto-video.types";
import { generateScenesFromTemplate } from "./auto-video-template.service";
import { buildStoryboard } from "./auto-video-scene.service";
import { createManifest } from "./auto-video-render-manifest.service";

import { autoVideoStoreGet, autoVideoStoreSet } from "./auto-video-storage";

const STORAGE_KEY = "lecipm-auto-video-jobs-v1";

function loadJobs(): Map<string, AutoVideoJob> {
  const raw = autoVideoStoreGet(STORAGE_KEY);
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw) as AutoVideoJob[];
    return new Map(parsed.map(j => [j.id, j]));
  } catch {
    return new Map();
  }
}

function saveJobs(jobs: Map<string, AutoVideoJob>) {
  autoVideoStoreSet(STORAGE_KEY, JSON.stringify(Array.from(jobs.values())));
}

export function createVideoJob(
  request: AutoVideoRequest
): AutoVideoJob {
  const jobs = loadJobs();
  const scenes = generateScenesFromTemplate(request.templateId, request);
  const manifest = createManifest(request, scenes);
  const shotList = buildStoryboard(scenes);

  const job: AutoVideoJob = {
    id: `job_${Math.random().toString(36).slice(2, 7)}`,
    request,
    manifest,
    shotList,
    status: request.status || "DRAFT",
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  };

  jobs.set(job.id, job);
  saveJobs(jobs);
  return job;
}

export function getJob(id: string): AutoVideoJob | undefined {
  return loadJobs().get(id);
}

export function listJobs(): AutoVideoJob[] {
  return Array.from(loadJobs().values()).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export function updateJobStatus(
  id: string,
  status: AutoVideoJobStatus,
  adminId?: string
): AutoVideoJob | null {
  const jobs = loadJobs();
  const job = jobs.get(id);
  if (!job) return null;

  job.status = status;
  job.updatedAtIso = new Date().toISOString();
  if (status === "APPROVED" && adminId) {
    job.approvedByUserId = adminId;
    job.approvedAtIso = new Date().toISOString();
  }

  saveJobs(jobs);
  return job;
}
