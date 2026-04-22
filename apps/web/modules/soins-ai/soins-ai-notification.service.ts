import { prisma } from "@/lib/db";

import type { NotificationRoutingPlan, SoinsAiAssessment } from "./soins-ai.types";

function assessmentTouchesCameraInfrastructure(a: SoinsAiAssessment): boolean {
  return (
    a.reasons.some((r) => /\bcamera|stream|infra/i.test(r)) ||
    a.explainability.some((x) => /camera|stream/i.test(x.description))
  );
}

/**
 * Permission-aware routing plan — does not send notifications by itself.
 * Downstream jobs should use `familyNotifyUserIds` for general operational messages,
 * and scope camera-specific copy to `familyCameraNotifyUserIds`.
 */
export async function planSoinsAiNotifications(params: {
  residentId: string;
  assessment: SoinsAiAssessment;
}): Promise<NotificationRoutingPlan> {
  const suppressed: NotificationRoutingPlan["suppressed"] = [];

  const rows = await prisma.familyAccess.findMany({
    where: { residentId: params.residentId },
    select: {
      familyUserId: true,
      canReceiveAlerts: true,
      canViewCamera: true,
      resident: {
        select: {
          residence: { select: { operatorId: true } },
        },
      },
    },
  });

  const residenceOperatorUserId = rows[0]?.resident.residence.operatorId ?? null;

  const familyNotifyUserIds = rows.filter((r) => r.canReceiveAlerts).map((r) => r.familyUserId);

  const cameraScoped = assessmentTouchesCameraInfrastructure(params.assessment);
  const familyCameraNotifyUserIds = cameraScoped
    ? rows.filter((r) => r.canReceiveAlerts && r.canViewCamera).map((r) => r.familyUserId)
    : familyNotifyUserIds;

  if (familyNotifyUserIds.length === 0) {
    suppressed.push({
      audience: "family",
      reason: "No family contacts have operational alerts enabled.",
    });
  }

  if (cameraScoped && familyCameraNotifyUserIds.length === 0) {
    suppressed.push({
      audience: "family_camera_channel",
      reason: "Camera-related operational notice suppressed — no viewers with camera permission.",
    });
  }

  const notifyAdmin =
    params.assessment.notifyAdmin ||
    params.assessment.riskLevel === "CRITICAL" ||
    params.assessment.riskLevel === "HIGH";

  return {
    residentId: params.residentId,
    assessmentRisk: params.assessment.riskLevel,
    familyNotifyUserIds,
    familyCameraNotifyUserIds,
    residenceOperatorUserId,
    notifyAdmin,
    suppressed,
  };
}
