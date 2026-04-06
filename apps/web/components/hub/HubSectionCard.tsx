import type { ReactNode } from "react";
import type { HubTheme } from "@/lib/hub/themes";
import { PremiumSectionCard } from "./PremiumSectionCard";

type HubSectionCardProps = {
  title: string;
  children: ReactNode;
  theme?: HubTheme;
  className?: string;
};

/** Registry-aligned section card — same shell as legacy PremiumSectionCard. */
export function HubSectionCard(props: HubSectionCardProps) {
  return <PremiumSectionCard {...props} />;
}
