import { Router, type Request, type Response } from "express";
import { createIncidentBodySchema, listIncidentsQuerySchema } from "../validation/schemas.js";
import { validateBody, validateQuery, sendValidationError } from "../validation/validate.js";
import { createIncident, listIncidents, getModerationQueueIncidents } from "../incidents/incidentService.js";

export function createIncidentsRouter(): Router {
  const router = Router();

  /** POST /incidents — report an incident. */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(createIncidentBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const incident = await createIncident(validation.data);
      res.status(201).json(incident);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INCIDENT_ERROR", message: "Failed to create incident" } });
    }
  });

  /** GET /incidents — list incidents (moderation queue when status=PENDING). */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(listIncidentsQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const result = await listIncidents(validation.data);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list incidents" } });
    }
  });

  return router;
}

