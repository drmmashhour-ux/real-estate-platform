import type { Metadata } from "next";
import { GuestBookingFlowDemo } from "@/components/bnhub/demo/GuestBookingFlowDemo";

export const metadata: Metadata = {
  title: "BNHub — Guest booking flow (demo)",
  description:
    "Interactive simulation: search, results, listing detail, transparent pricing, and confirmation — designed for clarity and trust.",
};

export default function BnhubGuestFlowDemoPage() {
  return <GuestBookingFlowDemo />;
}
