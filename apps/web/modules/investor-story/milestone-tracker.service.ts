import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type TractionMilestone = {
  id: "users_100" | "users_1000" | "bookings_monthly" | "deals_pipeline";
  label: string;
  target: number;
  current: number;
  unit: "users" | "count";
  complete: boolean;
};

const NON_CANCELLED_BOOKING: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_HOST_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
  BookingStatus.DISPUTED,
];

export async function buildTractionMilestones(): Promise<{ milestones: TractionMilestone[]; generatedAt: string }> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [totalUsers, bookingsMonth, dealsOpen] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count({
      where: { createdAt: { gte: monthStart }, status: { in: NON_CANCELLED_BOOKING } },
    }),
    prisma.deal.count({
      where: { status: { notIn: ["closed", "cancelled"] } },
    }),
  ]);

  const milestones: TractionMilestone[] = [
    {
      id: "users_100",
      label: "First 100 registered users",
      target: 100,
      current: totalUsers,
      unit: "users",
      complete: totalUsers >= 100,
    },
    {
      id: "users_1000",
      label: "1,000 registered users (PMF signal threshold)",
      target: 1000,
      current: totalUsers,
      unit: "users",
      complete: totalUsers >= 1000,
    },
    {
      id: "bookings_monthly",
      label: "Bookings created (month to date, non-cancelled pipeline)",
      target: 0,
      current: bookingsMonth,
      unit: "count",
      complete: bookingsMonth > 0,
    },
    {
      id: "deals_pipeline",
      label: "Residential deals in non-terminal pipeline",
      target: 0,
      current: dealsOpen,
      unit: "count",
      complete: dealsOpen > 0,
    },
  ];

  return { milestones, generatedAt: now.toISOString() };
}
