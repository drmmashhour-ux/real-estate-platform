import { prisma } from "@/lib/db";

/** Confirmed or in-progress bookings created in the last 7 days for conversion messaging. */
export async function countListingBookingsLast7Days(listingId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  return prisma.booking.count({
    where: {
      listingId,
      createdAt: { gte: since },
      status: { in: ["PENDING", "AWAITING_HOST_APPROVAL", "CONFIRMED", "COMPLETED"] },
    },
  });
}

/** Default check-in / check-out when URL has no dates (tomorrow + 2 nights). */
export function defaultBnhubStayDateRange(): { checkIn: string; checkOut: string } {
  const today = new Date();
  const checkInD = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const checkOutD = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { checkIn: ymd(checkInD), checkOut: ymd(checkOutD) };
}

const STRENGTH_KEYWORDS: { key: string; label: string }[] = [
  { key: "clean", label: "Clean" },
  { key: "location", label: "Location" },
  { key: "host", label: "Host" },
  { key: "quiet", label: "Quiet" },
  { key: "comfortable", label: "Comfort" },
  { key: "spacious", label: "Space" },
  { key: "view", label: "Views" },
  { key: "walk", label: "Walkable" },
  { key: "downtown", label: "Downtown" },
];

/** Derive 1–3 guest-review themes from comment text for social proof. */
export function guestReviewStrengthLabels(
  reviews: { comment: string | null | undefined }[]
): string[] {
  const counts = new Map<string, number>();
  for (const r of reviews) {
    const t = (r.comment ?? "").toLowerCase();
    for (const { key, label } of STRENGTH_KEYWORDS) {
      if (t.includes(key)) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);
}
