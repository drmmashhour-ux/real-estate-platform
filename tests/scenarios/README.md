# Scenario definitions

Tunnel implementations live in **`apps/web/modules/testing/tunnels/lecipm-tunnels.ts`** and are orchestrated by **`apps/web/modules/testing/test-runner.service.ts`**.

Add a new tunnel by:

1. Implementing `async function tunnelX(logger): Promise<TunnelTestResult>` in `lecipm-tunnels.ts`.
2. Registering it in `TUNNELS` inside `test-runner.service.ts`.
3. Re-running `pnpm --filter @lecipm/web run validate:lecipm-system`.
