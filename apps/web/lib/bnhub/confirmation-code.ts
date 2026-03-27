import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. BNH-A3K9P2 */
export function generateConfirmationCode(): string {
  const buf = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[buf[i]! % ALPHABET.length];
  }
  return `BNH-${suffix}`;
}

/** Allocate a confirmation code unique across `Booking.confirmationCode`. */
export async function allocateUniqueConfirmationCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateConfirmationCode();
    const clash = await prisma.booking.findUnique({
      where: { confirmationCode: code },
      select: { id: true },
    });
    if (!clash) return code;
  }
  throw new Error("Could not allocate a unique BNHub confirmation code");
}
