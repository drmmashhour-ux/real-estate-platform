-- BNHub mobile ecosystem: safety policy engine, favorites, notifications, review moderation

CREATE TYPE "BnhubSafetyReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'RESTRICTED', 'REJECTED', 'MANUAL_REVIEW_REQUIRED');
CREATE TYPE "BnhubSafetyFlagStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE "BnhubSafetyFlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "BnhubMobileNotificationChannel" AS ENUM ('PUSH', 'IN_APP', 'EMAIL');
CREATE TYPE "BnhubMobileNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');
CREATE TYPE "BnhubReviewModerationStatus" AS ENUM ('VISIBLE', 'PENDING', 'HIDDEN');

CREATE TABLE "bnhub_restricted_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boundary_geo_json" JSONB NOT NULL,
    "policy_notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_restricted_zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_restricted_zones_is_active_idx" ON "bnhub_restricted_zones"("is_active");

CREATE TABLE "bnhub_listing_safety_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "review_status" "BnhubSafetyReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "public_message_key" TEXT NOT NULL DEFAULT 'approved',
    "booking_allowed" BOOLEAN NOT NULL DEFAULT true,
    "listing_visible" BOOLEAN NOT NULL DEFAULT true,
    "requires_exterior_photo" BOOLEAN NOT NULL DEFAULT false,
    "requires_host_id_match" BOOLEAN NOT NULL DEFAULT false,
    "requires_manual_location_confirm" BOOLEAN NOT NULL DEFAULT false,
    "internal_notes" TEXT,
    "restricted_zone_id" TEXT,
    "last_reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_listing_safety_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_listing_safety_profiles_listing_id_key" ON "bnhub_listing_safety_profiles"("listing_id");
CREATE INDEX "bnhub_listing_safety_profiles_review_status_idx" ON "bnhub_listing_safety_profiles"("review_status");
CREATE INDEX "bnhub_listing_safety_profiles_listing_id_idx" ON "bnhub_listing_safety_profiles"("listing_id");

ALTER TABLE "bnhub_listing_safety_profiles" ADD CONSTRAINT "bnhub_listing_safety_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_listing_safety_profiles" ADD CONSTRAINT "bnhub_listing_safety_profiles_restricted_zone_id_fkey" FOREIGN KEY ("restricted_zone_id") REFERENCES "bnhub_restricted_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bnhub_safety_flags" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "flag_type" TEXT NOT NULL,
    "severity" "BnhubSafetyFlagSeverity" NOT NULL DEFAULT 'LOW',
    "status" "BnhubSafetyFlagStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "evidence_json" JSONB,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_safety_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_safety_flags_listing_id_idx" ON "bnhub_safety_flags"("listing_id");
CREATE INDEX "bnhub_safety_flags_status_idx" ON "bnhub_safety_flags"("status");
CREATE INDEX "bnhub_safety_flags_severity_idx" ON "bnhub_safety_flags"("severity");

ALTER TABLE "bnhub_safety_flags" ADD CONSTRAINT "bnhub_safety_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_safety_audit_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "actor_user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_safety_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_safety_audit_logs_listing_id_idx" ON "bnhub_safety_audit_logs"("listing_id");
CREATE INDEX "bnhub_safety_audit_logs_actor_user_id_idx" ON "bnhub_safety_audit_logs"("actor_user_id");
CREATE INDEX "bnhub_safety_audit_logs_created_at_idx" ON "bnhub_safety_audit_logs"("created_at");

CREATE TABLE "bnhub_guest_favorites" (
    "id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_guest_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_guest_favorites_user_listing_key" ON "bnhub_guest_favorites"("guest_user_id", "listing_id");
CREATE INDEX "bnhub_guest_favorites_guest_user_id_idx" ON "bnhub_guest_favorites"("guest_user_id");
CREATE INDEX "bnhub_guest_favorites_listing_id_idx" ON "bnhub_guest_favorites"("listing_id");

ALTER TABLE "bnhub_guest_favorites" ADD CONSTRAINT "bnhub_guest_favorites_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_guest_favorites" ADD CONSTRAINT "bnhub_guest_favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_mobile_notification_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" "BnhubMobileNotificationChannel" NOT NULL,
    "status" "BnhubMobileNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data_json" JSONB,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_mobile_notification_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_mobile_notification_queue_user_id_status_idx" ON "bnhub_mobile_notification_queue"("user_id", "status");
CREATE INDEX "bnhub_mobile_notification_queue_scheduled_for_idx" ON "bnhub_mobile_notification_queue"("scheduled_for");

ALTER TABLE "bnhub_mobile_notification_queue" ADD CONSTRAINT "bnhub_mobile_notification_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_review_moderation" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "status" "BnhubReviewModerationStatus" NOT NULL DEFAULT 'VISIBLE',
    "moderated_by_user_id" TEXT,
    "reason" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_review_moderation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_review_moderation_review_id_key" ON "bnhub_review_moderation"("review_id");
CREATE INDEX "bnhub_review_moderation_status_idx" ON "bnhub_review_moderation"("status");

ALTER TABLE "bnhub_review_moderation" ADD CONSTRAINT "bnhub_review_moderation_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_review_abuse_reports" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_review_abuse_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_review_abuse_reports_review_id_idx" ON "bnhub_review_abuse_reports"("review_id");
CREATE INDEX "bnhub_review_abuse_reports_reporter_user_id_idx" ON "bnhub_review_abuse_reports"("reporter_user_id");

ALTER TABLE "bnhub_review_abuse_reports" ADD CONSTRAINT "bnhub_review_abuse_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (Supabase direct access). App server may use service role.
ALTER TABLE "bnhub_listing_safety_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_lsp_select_host_admin" ON "bnhub_listing_safety_profiles"
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR EXISTS (SELECT 1 FROM "bnhub_listings" l WHERE l.id = listing_id AND l.host_id = (auth.uid())::text)
  );
CREATE POLICY "bnhub_lsp_write_admin" ON "bnhub_listing_safety_profiles"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_safety_flags" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_sf_admin_only" ON "bnhub_safety_flags"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_restricted_zones" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_rz_admin" ON "bnhub_restricted_zones"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_safety_audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_sal_admin" ON "bnhub_safety_audit_logs"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_guest_favorites" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_gf_own" ON "bnhub_guest_favorites"
  FOR ALL TO authenticated
  USING (guest_user_id = (auth.uid())::text)
  WITH CHECK (guest_user_id = (auth.uid())::text);

ALTER TABLE "bnhub_mobile_notification_queue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_mnq_own_admin" ON "bnhub_mobile_notification_queue"
  FOR ALL TO authenticated
  USING (user_id = (auth.uid())::text OR public.is_platform_admin_uid())
  WITH CHECK (user_id = (auth.uid())::text OR public.is_platform_admin_uid());

ALTER TABLE "bnhub_review_moderation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_rm_admin" ON "bnhub_review_moderation"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_review_abuse_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_rar_insert_own" ON "bnhub_review_abuse_reports"
  FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = (auth.uid())::text);
CREATE POLICY "bnhub_rar_select_own_admin" ON "bnhub_review_abuse_reports"
  FOR SELECT TO authenticated
  USING (reporter_user_id = (auth.uid())::text OR public.is_platform_admin_uid());
