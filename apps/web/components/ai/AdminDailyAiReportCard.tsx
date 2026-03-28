"use client";

import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

export function AdminDailyAiReportCard(props: {
  stats: {
    totalUsers: number;
    totalListings: number;
    activeListings: number;
    totalBookings: number;
    bookingsToday: number;
    revenueTodayCents: number;
    openDisputesCount: number;
    pendingPayoutsCount: number;
  };
}) {
  return (
    <HubAiInsightWidget
      hub="admin"
      feature="daily_report"
      intent="summary"
      title="AI Daily Report"
      context={{ ...props.stats, generatedAt: new Date().toISOString() }}
      accent="var(--color-premium-gold)"
    />
  );
}
