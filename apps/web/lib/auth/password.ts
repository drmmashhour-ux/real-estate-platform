import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const SALT_LEN = 16;
const KEY_LEN = 64;

/** Hash a password for storage. Uses scrypt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/** Verify password against stored hash. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const keyBuf = Buffer.from(keyHex, "hex");
  return keyBuf.length === derived.length && timingSafeEqual(derived, keyBuf);
}
