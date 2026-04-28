/**
 * Prisma 7+: `schema.prisma` must not declare `url`; clients need `datasourceUrl`
 * when constructed. Next/Vercel provide `DATABASE_URL` from `.env.local` / project env.
 */
export function lecipmPrismaClientOptions(): { datasourceUrl: string } {
  const u = process.env.DATABASE_URL?.trim();
  if (!u) {
    throw new Error(
      "DATABASE_URL is not set — required for PrismaClient (LECIPM / Prisma 7+)."
    );
  }
  return { datasourceUrl: u };
}
