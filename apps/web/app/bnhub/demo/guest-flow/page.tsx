import type { Metadata } from "next";
import { GuestBookingFlowDemo } from "@/components/bnhub/demo/GuestBookingFlowDemo";

export const metadata: Metadata = {
  title: "BNHub — Guest booking flow (demo)",
  description:
    "Interactive simulation: search → results → listing → booking → confirmation. Transparent pricing and trust-first UI.",
};

/** Real guest booking flow simulation (client-side state machine; no live API). */
export default function BnhubGuestFlowDemoPage() {
  return <GuestBookingFlowDemo />;
}
