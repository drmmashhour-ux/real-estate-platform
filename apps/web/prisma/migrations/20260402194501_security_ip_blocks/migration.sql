-- CreateTable
CREATE TABLE "security_ip_blocks" (
    "id" TEXT NOT NULL,
    "ip_fingerprint" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_ip_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_ip_blocks_ip_fingerprint_key" ON "security_ip_blocks"("ip_fingerprint");

-- CreateIndex
CREATE INDEX "security_ip_blocks_expires_at_idx" ON "security_ip_blocks"("expires_at");
