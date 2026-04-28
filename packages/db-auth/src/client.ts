import { createNoopPrismaClient } from '@repo/prisma-disabled-stub'
import { PrismaClient } from './generated/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  if (process.env.NEXT_PUBLIC_DISABLE_DB === 'true') {
    return createNoopPrismaClient() as PrismaClient
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
