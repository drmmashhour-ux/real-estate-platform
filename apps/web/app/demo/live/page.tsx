import { flags } from "@/lib/flags";

import { LiveDemoInteractive } from "./LiveDemoInteractive";
import { LiveDemoStatic } from "./LiveDemoStatic";

/**
 * Order 46 — `/demo/live`: interactive walkthrough when `FEATURE_RECO=1`, else static cards.
 */
export default function LiveDemoPage() {
  if (!flags.RECOMMENDATIONS) {
    return <LiveDemoStatic />;
  }
  return <LiveDemoInteractive />;
}
