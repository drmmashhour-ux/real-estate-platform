import { Router, type Request, type Response } from "express";
import { createSuspensionBodySchema, listSuspensionsQuerySchema } from "../validation/schemas.js";
import { validateBody, validateQuery, sendValidationError } from "../validation/validate.js";
import { createSuspension, listSuspensions } from "../suspensions/suspensionService.js";

export function createSuspensionsRouter(): Router {
  const router = Router();

  /** POST /suspensions — create a suspension (account or listing). */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(createSuspensionBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const suspension = await createSuspension(validation.data);
      res.status(201).json(suspension);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "SUSPENSION_ERROR", message: "Failed to create suspension" } });
    }
  });

  /** GET /suspensions — list suspensions (optional filters). */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(listSuspensionsQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const data = await listSuspensions(validation.data);
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list suspensions" } });
    }
  });

  return router;
}
