-- CreateTable
CREATE TABLE "early_access_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" VARCHAR(64),
    "referrer" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_access_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "early_access_subscribers_email_key" ON "early_access_subscribers"("email");

-- CreateIndex
CREATE INDEX "early_access_subscribers_created_at_idx" ON "early_access_subscribers"("created_at");
