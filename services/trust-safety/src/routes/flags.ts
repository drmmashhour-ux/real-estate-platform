import { Router, type Request, type Response } from "express";
import { createFlagBodySchema, listFlagsQuerySchema } from "../validation/schemas.js";
import { validateBody, validateQuery, sendValidationError } from "../validation/validate.js";
import { createFlag, listFlags, getModerationQueueFlags } from "../flags/flagService.js";

export function createFlagsRouter(): Router {
  const router = Router();

  /** POST /flags — create an account or listing flag. */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(createFlagBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const flag = await createFlag(validation.data);
      res.status(201).json(flag);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "FLAG_ERROR", message: "Failed to create flag" } });
    }
  });

  /** GET /flags — list flags (moderation queue when status=PENDING). */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(listFlagsQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const result = await listFlags(validation.data);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list flags" } });
    }
  });

  return router;
}

