import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeRuntimeConfig } from "@nexora/shared-types";
import { createApiGatewayApp } from "../app.js";

test("api gateway runtime rejects live payment env", () => {
  assert.throws(() => assertSafeRuntimeConfig({ LIVE_PAYMENTS_ENABLED: "1" }), /Unsafe live payment/);
});

test("api gateway exposes health and mock admin session", async () => {
  const app = createApiGatewayApp();
  const server = app.listen(0);
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    const session = await fetch(`${baseUrl}/api/auth/mock-admin`, { method: "POST" });
    assert.equal(session.status, 201);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
