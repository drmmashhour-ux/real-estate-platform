import type { Request, Response } from "express";
import { getAlerts, updateAlertStatus } from "../services/alert-store.js";

export function getAlertsList(req: Request, res: Response): void {
  const alertType = req.query.alertType as string | undefined;
  const severity = req.query.severity as string | undefined;
  const status = req.query.status as string | undefined;
  const limit = req.query.limit != null ? Number(req.query.limit) : 50;
  const offset = req.query.offset != null ? Number(req.query.offset) : 0;
  const alerts = getAlerts({
    alertType: alertType as Parameters<typeof getAlerts>[0]["alertType"],
    severity: severity as Parameters<typeof getAlerts>[0]["severity"],
    status: status as Parameters<typeof getAlerts>[0]["status"],
    limit,
    offset,
  });
  res.json({ alerts });
}
