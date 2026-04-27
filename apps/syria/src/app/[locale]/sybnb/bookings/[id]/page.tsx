import { prisma } from "@/lib/db";
import { redirect } from "@/i18n/navigation";
import { LegacySyriaStayBookingDetail } from "@/components/sybnb/LegacySyriaStayBookingDetail";

type Props = { params: Promise<{ locale: string; id: string }> };

/**
 * SYBNB-1 `SybnbBooking` rows use `/sybnb/requests/[id]`.
 * Only legacy `SyriaBooking` (stay) rows render here.
 */
export default async function SybnbBookingsIdPage(props: Props) {
  const { locale, id } = await props.params;
  const v1 = await prisma.sybnbBooking.findUnique({ where: { id }, select: { id: true } });
  if (v1) {
    redirect({ href: `/sybnb/requests/${id}`, locale });
  }
  return <LegacySyriaStayBookingDetail id={id} />;
}
