import type { PrismaClient } from "@prisma/client";
import { prisma } from "@repo/db";

/**
 * Choke point for the monolith Prisma client (repo package `db`).
 * Returns the package singleton from that package, not a second `PrismaClient` instance.
 */
export function getLegacyDB(): PrismaClient {
  return prisma;
}
