import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

export function requireAuth(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  return verifyToken(token);
}
