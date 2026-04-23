import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { CameraPanel } from "@/components/soins/CameraPanel";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";

export const dynamic = "force-dynamic";

export default async function SoinsFamilyCameraPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const back = `/${locale}/${country}/dashboard/soins/family`;

  const link = await prisma.familyAccess.findFirst({
    where: { familyUserId: userId },
    select: { canViewCamera: true, residentId: true },
  });

  const stream = link?.canViewCamera
    ? await prisma.cameraStream.findFirst({
        where: { residentId: link.residentId, isActive: true },
      })
    : null;

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="Caméra" backHref={back} />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <CameraPanel
          canAccess={!!link?.canViewCamera}
          streamUrl={stream?.streamUrl ?? null}
          statusLevel={link?.canViewCamera ? "normal" : "attention"}
          statusLabel={link?.canViewCamera ? "Autorisé" : "Permission requise"}
        />
      </div>
    </div>
  );
}
