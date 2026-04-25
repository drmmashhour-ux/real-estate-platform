import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Whether to show the “How was your experience?” prompt. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ show: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      brokerTestimonialPromptEligibleAt: true,
      brokerTestimonialNudgeDismissedAt: true,
    },
  });
  if (!user || user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ show: false });
  }

  const submitted = await prisma.testimonial.findFirst({
    where: { brokerId: userId },
    select: { id: true },
  });

  const show =
    Boolean(user.brokerTestimonialPromptEligibleAt) &&
    !submitted &&
    !user.brokerTestimonialNudgeDismissedAt;

  return NextResponse.json({ show });
}
