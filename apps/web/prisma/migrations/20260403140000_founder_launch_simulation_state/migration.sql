-- Founder launch simulation + pitch overrides (platform executive)

CREATE TABLE "founder_launch_simulation_state" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assumptions_json" JSONB NOT NULL,
    "pitch_overrides_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_launch_simulation_state_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "founder_launch_simulation_state_user_id_key" ON "founder_launch_simulation_state"("user_id");

ALTER TABLE "founder_launch_simulation_state" ADD CONSTRAINT "founder_launch_simulation_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
