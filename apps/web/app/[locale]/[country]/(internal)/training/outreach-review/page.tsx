import type { Metadata } from "next";
import { OutreachReviewTool } from "@/components/training/OutreachReviewTool";

export const metadata: Metadata = {
  title: "Outreach review (internal)",
  robots: { index: false, follow: false },
};

export default function OutreachReviewTrainingPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 sm:px-6">
      <OutreachReviewTool />
    </main>
  );
}
