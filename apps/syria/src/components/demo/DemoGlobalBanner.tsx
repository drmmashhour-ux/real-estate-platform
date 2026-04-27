/**
 * Server-rendered ribbon when investor demo mode is enabled (env-driven).
 */
export function DemoGlobalBanner() {
  if (process.env.INVESTOR_DEMO_MODE !== "true") {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-amber-400 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950"
    >
      ⚠️ DEMO MODE ACTIVE — No real payments or real transactions are processed
    </div>
  );
}
