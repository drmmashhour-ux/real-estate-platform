import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "./app.js";

const hasDb = !!process.env["DATABASE_URL"];

describe.runIf(hasDb)("Auth API integration", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "SecurePass123";
  let accessToken: string;
  let refreshToken: string;

  it("POST /v1/auth/register returns 201 and tokens", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({ email: testEmail, password: testPassword, name: "Integration User" })
      .expect(201);

    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.roles).toContain("GUEST");
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("expiresIn");
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /v1/auth/register same email returns 409", async () => {
    await request(app)
      .post("/v1/auth/register")
      .send({ email: testEmail, password: "other" })
      .expect(409);
  });

  it("GET /v1/auth/me with Bearer returns current user", async () => {
    const res = await request(app)
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.email).toBe(testEmail);
  });

  it("GET /v1/auth/me without token returns 401", async () => {
    await request(app).get("/v1/auth/me").expect(401);
  });

  it("POST /v1/auth/login returns tokens", async () => {
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body).toHaveProperty("accessToken");
    refreshToken = res.body.refreshToken;
  });

  it("POST /v1/auth/refresh returns new tokens", async () => {
    const res = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken })
      .expect(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("POST /v1/auth/logout returns 204", async () => {
    await request(app).post("/v1/auth/logout").send({ refreshToken }).expect(204);
  });
});
