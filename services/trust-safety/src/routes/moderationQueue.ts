import { Router, type Request, type Response } from "express";
import { getModerationQueueIncidents } from "../incidents/incidentService.js";
import { getModerationQueueFlags } from "../flags/flagService.js";

export function createModerationQueueRouter(): Router {
  const router = Router();

  /** GET /moderation/queue/incidents — pending incidents. */
  router.get("/incidents", async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await getModerationQueueIncidents(50);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get queue" } });
    }
  });

  /** GET /moderation/queue/flags — pending flags. */
  router.get("/flags", async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await getModerationQueueFlags(50);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get queue" } });
    }
  });

  return router;
}
