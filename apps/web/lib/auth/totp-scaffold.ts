/**
 * TOTP (RFC 6238) scaffolding for future admin 2FA — not wired to login yet.
 * Email OTP already exists (`twoFactorEmailEnabled` + `/api/auth/login/verify-2fa`).
 *
 * Next steps: store `totpSecret` encrypted per user, enroll flow, backup codes,
 * and require TOTP after password for ADMIN when `ADMIN_TOTP_REQUIRED=1`.
 */

export type TotpEnrollmentStub = {
  userId: string;
  /** base32 secret — never log */
  secret: string;
  otpauthUrl: string;
};

export function totpScaffoldPlaceholder(): string {
  return "totp-not-enabled";
}
