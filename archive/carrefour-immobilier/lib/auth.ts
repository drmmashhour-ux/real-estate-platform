import jwt from "jsonwebtoken";

/** JWT payload: `id` + `role` only (no password). */
export function signToken(user: { id: string; role: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign({ id: user.id, role: user.role }, secret);
}
