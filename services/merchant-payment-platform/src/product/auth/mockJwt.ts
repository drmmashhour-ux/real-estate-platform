import { createHmac, timingSafeEqual } from "node:crypto";

const HEADER = Object.freeze({ alg: "HS256", typ: "JWT", mock: true });

export interface MockJwtPayload {
  sub: string;
  role: "admin" | "merchant";
  merchantId?: string;
  sessionId: string;
  exp: number;
}

export function signMockJwt(payload: MockJwtPayload, secret: string): string {
  const encodedHeader = base64UrlEncode(JSON.stringify(HEADER));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyMockJwt(token: string, secret: string): MockJwtPayload {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) throw new Error("Invalid token structure.");
  const expected = sign(`${encodedHeader}.${encodedPayload}`, secret);
  if (!safeEqual(signature, expected)) throw new Error("Invalid token signature.");
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as MockJwtPayload;
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error("Session token expired.");
  return payload;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
