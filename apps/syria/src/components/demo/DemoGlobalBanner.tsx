import { getDemoSessionPublicState } from "@/lib/demo/demo-session";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { DemoSessionExpiryClient } from "@/components/demo/DemoSessionExpiryClient";

/**
 * Server-rendered ribbon when investor demo mode is enabled (env + optional runtime toggle).
 */
export function DemoGlobalBanner() {
  if (!isInvestorDemoModeActive()) {
    return null;
  }

  const session = getDemoSessionPublicState();

  const headline = session.sessionActive
    ? "⚠️ DEMO SESSION ACTIVE — All actions are simulated"
    : "⚠️ DEMO MODE ACTIVE — No real payments or real transactions are processed";

  return (
    <div
      role="status"
      className="border-b border-amber-400 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950"
    >
      <div>{headline}</div>
      {session.sessionActive && session.expiresAtIso ? (
        <DemoSessionExpiryClient expiresAtIso={session.expiresAtIso} />
      ) : null}
    </div>
  );
}
