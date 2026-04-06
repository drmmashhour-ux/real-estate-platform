-- Mortgage broker directory + user mortgage evaluation requests
CREATE TABLE "mortgage_brokers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_brokers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mortgage_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "property_price" DOUBLE PRECISION NOT NULL,
    "down_payment" DOUBLE PRECISION NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mortgage_brokers_user_id_key" ON "mortgage_brokers"("user_id");
CREATE INDEX "mortgage_brokers_user_id_idx" ON "mortgage_brokers"("user_id");
CREATE INDEX "mortgage_requests_user_id_idx" ON "mortgage_requests"("user_id");
CREATE INDEX "mortgage_requests_broker_id_idx" ON "mortgage_requests"("broker_id");
CREATE INDEX "mortgage_requests_status_created_at_idx" ON "mortgage_requests"("status", "created_at");

ALTER TABLE "mortgage_brokers" ADD CONSTRAINT "mortgage_brokers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mortgage_requests" ADD CONSTRAINT "mortgage_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mortgage_requests" ADD CONSTRAINT "mortgage_requests_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
