import { launchSystemV1Flags } from "@/config/feature-flags";
import { requireLaunchSystemPlatform } from "@/lib/launch-system-api-auth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { listOutreachLeads } from "@/modules/outreach-crm/crm.service";
import { buildMontrealHostAcquisitionSnapshot } from "@/modules/host-acquisition/host-acquisition.service";

export const dynamic = "force-dynamic";

/** GET /api/acquisition/leads — listing acquisition + outreach CRM (platform admin). */
export async function GET() {
  const auth = await requireLaunchSystemPlatform();
  if (!auth.ok) return auth.response;
  if (!launchSystemV1Flags.hostAcquisitionPipelineV1) {
    return Response.json({ error: "Host acquisition pipeline disabled" }, { status: 403 });
  }

  const [snapshot, outreach, listingAcquisition] = await Promise.all([
    buildMontrealHostAcquisitionSnapshot(),
    listOutreachLeads(300),
    prisma.listingAcquisitionLead.findMany({
      where: {
        OR: [
          { city: { contains: "Montreal", mode: "insensitive" } },
          { city: { contains: "Montréal", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        city: true,
        intakeStatus: true,
        sourceType: true,
        createdAt: true,
      },
    }),
  ]);

  return Response.json({
    ok: true,
    snapshot,
    outreach,
    listingAcquisition,
  });
}
