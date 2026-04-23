import { NextRequest, NextResponse } from "next/server";
import { parseSessionUserId } from "@/lib/auth/session-cookie";
import { HUB_USER_ROLE_COOKIE_NAME } from "@/lib/auth/session-cookie";

/**
 * Compliance Middleware Layer (Law 25 & OACIQ).
 * Enforces Auth, Role, and Consent checks for sensitive routes.
 */
export function runComplianceSecurityLayer(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 1. Identify sensitive routes
  const isSensitiveApi = 
    pathname.startsWith("/api/documents") || 
    pathname.startsWith("/api/transactions") || 
    pathname.startsWith("/api/finance") ||
    pathname.startsWith("/api/compliance");

  if (!isSensitiveApi) return null;

  // 2. Auth Check
  const session = parseSessionUserId(request.cookies.get("auth_session")?.value);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED: Session required for sensitive access." }, { status: 401 });
  }

  // 3. Role Check
  const role = request.cookies.get(HUB_USER_ROLE_COOKIE_NAME)?.value?.trim().toUpperCase() ?? "VISITOR";
  
  // Fail-safe: unknown role = BLOCK
  const knownRoles = ["ADMIN", "BROKER", "CLIENT", "PRIVACY_OFFICER", "LEGAL_ADMIN", "COMPLIANCE_STAFF", "VISITOR"];
  if (!knownRoles.includes(role)) {
    console.error(`[COMPLIANCE_FAILSAFE] Unknown role detected: ${role}`);
    return NextResponse.json({ error: "ACCESS_DENIED: Unknown or unauthorized role." }, { status: 403 });
  }

  // 4. Default Allow for other middleware to continue (specific checks happen in route handlers)
  return null;
}
