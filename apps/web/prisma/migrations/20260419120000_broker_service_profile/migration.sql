-- Broker service area + specialization profile (explicit JSON; no auto-inference writes).
CREATE TABLE "broker_service_profiles" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "broker_service_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "broker_service_profiles_broker_id_key" ON "broker_service_profiles"("broker_id");
CREATE INDEX "broker_service_profiles_broker_id_idx" ON "broker_service_profiles"("broker_id");

ALTER TABLE "broker_service_profiles" ADD CONSTRAINT "broker_service_profiles_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
