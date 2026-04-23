import { PlatformRole } from "@prisma/client";

/**
 * Centralized Role-Based Access Control (RBAC) and Need-to-Know logic.
 * Ensures Law 25 compliance and OACIQ broker isolation.
 */
export function canAccess(user: { id: string; role: string }, resource: { type: string; ownerId?: string; brokerId?: string; allowedRoles?: string[]; organizationId?: string; sensitivityLevel?: string }) {
  // 1. ADMIN bypass (Full control)
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "PRIVACY_OFFICER") {
    return true;
  }

  // 2. Resource-specific logic
  if (resource.type === "FILE" || resource.type === "DOCUMENT") {
    // Owner can always access their own files
    if (resource.ownerId === user.id) return true;
    
    // Brokers on the file can access
    if (user.role === "BROKER" && resource.brokerId === user.id) return true;
    
    // Explicitly allowed roles
    if (resource.allowedRoles?.includes(user.role)) return true;
    
    // Default deny for other roles/users
    return false;
  }

  if (resource.type === "TRANSACTION") {
    // Participant check
    if (resource.ownerId === user.id || resource.brokerId === user.id) return true;
    return false;
  }

  // 3. Fall-safe: Default deny
  return false;
}

/**
 * Enforces need-to-know access for internal department transfers.
 */
export function canTransferToDepartment(toDepartment: string, user: { role: string }) {
  const departmentRoles: Record<string, string[]> = {
    MORTGAGE: ["MORTGAGE_EXPERT", "ADMIN", "COMPLIANCE_STAFF"],
    FINANCE: ["ACCOUNTANT", "ADMIN"],
    LEGAL: ["LEGAL_ADMIN", "PRIVACY_OFFICER", "ADMIN"],
    SUPPORT: ["SUPPORT_AGENT", "ADMIN"],
  };

  const allowedRoles = departmentRoles[toDepartment] || ["ADMIN"];
  return allowedRoles.includes(user.role);
}
