CREATE TABLE "assistance_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "request_type" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "related_listing_id" TEXT,
    "related_deal_id" TEXT,
    "related_broker_id" TEXT,
    "message" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "ai_suggested_path" TEXT,
    "status" TEXT NOT NULL,
    "thread_locked" BOOLEAN NOT NULL DEFAULT false,
    "linked_complaint_case_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistance_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assistance_requests_request_number_key" ON "assistance_requests"("request_number");
CREATE INDEX "idx_assistance_request_user" ON "assistance_requests"("user_id");
CREATE INDEX "idx_assistance_request_status" ON "assistance_requests"("status");
CREATE INDEX "idx_assistance_request_email" ON "assistance_requests"("email");

CREATE TABLE "assistance_messages" (
    "id" TEXT NOT NULL,
    "assistance_request_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_id" TEXT,
    "message" TEXT NOT NULL,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistance_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_assistance_messages_request" ON "assistance_messages"("assistance_request_id");

ALTER TABLE "assistance_messages" ADD CONSTRAINT "assistance_messages_assistance_request_id_fkey" FOREIGN KEY ("assistance_request_id") REFERENCES "assistance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "acknowledgment_templates" (
    "id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acknowledgment_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_ack_template_key_lang" ON "acknowledgment_templates"("template_key", "language");
CREATE INDEX "idx_ack_template_key" ON "acknowledgment_templates"("template_key");

INSERT INTO "acknowledgment_templates" ("id", "template_key", "language", "subject", "body", "is_active", "created_at")
VALUES
  (gen_random_uuid()::text, 'complaint_received', 'en', 'Complaint received', 'Hello {{name}},

We confirm receipt of your complaint ({{caseNumber}}). It is currently under review.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'info_request', 'en', 'Information request received', 'Hello {{name}},

We received your request and will respond shortly.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'under_review', 'en', 'Your file is under review', 'Hello {{name}},

Your request ({{caseNumber}}) is under review. We will update you when there is news.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'escalated', 'en', 'Escalation notice', 'Hello {{name}},

Your matter ({{caseNumber}}) has been escalated for further review. You will be informed of next steps.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'complaint_received', 'fr', 'Plainte reçue', 'Bonjour {{name}},

Nous accusons réception de votre plainte ({{caseNumber}}). Elle est en cours d''analyse.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'info_request', 'fr', 'Demande d''information reçue', 'Bonjour {{name}},

Nous avons bien reçu votre demande et vous répondrons sous peu.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'complaint_received', 'ar', 'تم استلام الشكوى', 'مرحبًا {{name}}،

نؤكد استلام شكواك ({{caseNumber}}). وهي قيد المراجعة.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'info_request', 'ar', 'تم استلام طلب المعلومات', 'مرحبًا {{name}}،

تلقينا طلبك وسنرد قريبًا.', true, CURRENT_TIMESTAMP)
ON CONFLICT ("template_key", "language") DO NOTHING;
