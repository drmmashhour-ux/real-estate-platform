import { PrismaClient } from '@prisma/client'
import { createNoopPrismaClient } from '@repo/prisma-disabled-stub'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isDbDisabledForUi(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_DB === 'true'
}

/** Prisma 7+: datasource URL is not in schema; constructor must receive `datasourceUrl`. */
function createPrismaClient(): PrismaClient {
  if (isDbDisabledForUi()) {
    return createNoopPrismaClient() as PrismaClient
  }
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL is not set — required for PrismaClient (Prisma 7+).')
  }
  return new PrismaClient({ datasourceUrl: url })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
