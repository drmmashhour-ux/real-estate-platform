import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { DemoSessionExpiryClient } from "@/components/demo/DemoSessionExpiryClient";

/**
 * Server-rendered ribbon when investor demo mode is enabled (env + optional runtime toggle).
 */
export function DemoGlobalBanner() {
  if (!isInvestorDemoModeActive()) {
    return null;
  }

  const sessionId = process.env.INVESTOR_DEMO_SESSION_ID?.trim();
  const expiresAtIso = process.env.INVESTOR_DEMO_MODE_EXPIRES_AT?.trim();

  const headline = sessionId
    ? "⚠️ DEMO SESSION ACTIVE — All actions are simulated"
    : "⚠️ DEMO MODE ACTIVE — No real payments or real transactions are processed";

  return (
    <div
      role="status"
      className="border-b border-amber-400 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950"
    >
      <div>{headline}</div>
      {expiresAtIso ? <DemoSessionExpiryClient expiresAtIso={expiresAtIso} /> : null}
    </div>
  );
}
