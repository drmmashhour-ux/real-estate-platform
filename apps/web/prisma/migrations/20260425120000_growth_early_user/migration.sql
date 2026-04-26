-- Order 44 — first-100 / early user cohort (one row per user, raw SQL + lib/growth/earlyUsers).
CREATE TABLE "EarlyUser" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarlyUser_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "EarlyUser" ADD CONSTRAINT "EarlyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
