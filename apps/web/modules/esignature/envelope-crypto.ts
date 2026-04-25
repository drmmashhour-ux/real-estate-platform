import { createHash, randomBytes } from "node:crypto";

export function sha256Hex(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashAccessToken(token: string): string {
  return sha256Hex(Buffer.from(token, "utf8"));
}

export function newAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOtp(otp: string): string {
  return sha256Hex(Buffer.from(otp.trim(), "utf8"));
}

export function generateOtp6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
