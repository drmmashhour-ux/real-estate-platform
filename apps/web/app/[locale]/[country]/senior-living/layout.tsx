import type { ReactNode } from "react";
import { SeniorLivingAccessibilityProvider } from "@/components/senior-living/SeniorLivingAccessibilityProvider";

export default function SeniorLivingSegmentLayout({ children }: { children: ReactNode }) {
  return <SeniorLivingAccessibilityProvider>{children}</SeniorLivingAccessibilityProvider>;
}
