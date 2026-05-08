import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createNoopPrismaClient } from '@repo/prisma-disabled-stub'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isDbDisabledForUi(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_DB === 'true'
}

/**
 * Prisma 7: requires driver adapter. datasourceUrl / datasources removed.
 * Uses @prisma/adapter-pg with DATABASE_URL from environment.
 */
function createPrismaClient(): PrismaClient {
  if (isDbDisabledForUi()) {
    return createNoopPrismaClient() as PrismaClient
  }
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL is not set — required for PrismaClient.')
  }
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
