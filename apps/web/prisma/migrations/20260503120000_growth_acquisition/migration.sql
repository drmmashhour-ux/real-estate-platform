-- Order 50 — first 1,000 user acquisition log (lib/growth/acquisition.ts)
CREATE TABLE "Acquisition" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid()::text),
    "source" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Acquisition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Acquisition_userId_idx" ON "Acquisition"("userId");
CREATE INDEX "Acquisition_source_idx" ON "Acquisition"("source");
CREATE INDEX "Acquisition_source_createdAt_idx" ON "Acquisition"("source", "createdAt");

ALTER TABLE "Acquisition" ADD CONSTRAINT "Acquisition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
