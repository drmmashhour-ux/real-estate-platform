import type { Metadata } from "next";
import { DemoTrainingClient } from "@/components/demo/DemoTrainingClient";

export const metadata: Metadata = {
  title: "Demo Training | LECIPM",
  description:
    "Guide section par section pour présenter LECIPM : script, étapes Turbo, risques, IA, score et signature. Mode pratique pour formations et onboarding.",
};

export default function DemoTrainingPage() {
  return <DemoTrainingClient />;
}
