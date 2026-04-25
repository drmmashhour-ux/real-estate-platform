import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LECIPM Premium UI",
  description: "LECIPM black / gold design system gallery and examples.",
};

export default function LecipmPremiumUiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
