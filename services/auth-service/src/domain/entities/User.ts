import type { Role } from "../enums/Role.js";

export type VerificationStatus = "PENDING" | "VERIFIED" | "FAILED";

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  phone: string | null;
  locale: string | null;
  timezone: string | null;
  verificationStatus: VerificationStatus;
  suspendedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}

/** Safe view for API responses (no passwordHash). */
export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export function toPublic(user: UserEntity): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt.toISOString(),
  };
}
