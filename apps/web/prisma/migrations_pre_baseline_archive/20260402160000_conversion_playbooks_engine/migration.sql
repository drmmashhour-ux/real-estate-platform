-- Conversion playbooks (structured closing flows)

CREATE TABLE "conversion_playbooks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "conversion_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversion_playbooks_key_key" ON "conversion_playbooks"("key");

CREATE TABLE "conversion_playbook_steps" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "trigger_condition" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "message_template" TEXT NOT NULL,
    CONSTRAINT "conversion_playbook_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversion_playbook_steps_playbook_id_step_order_key" ON "conversion_playbook_steps"("playbook_id", "step_order");
CREATE INDEX "conversion_playbook_steps_playbook_id_idx" ON "conversion_playbook_steps"("playbook_id");

ALTER TABLE "conversion_playbook_steps" ADD CONSTRAINT "conversion_playbook_steps_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "conversion_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "conversion_playbook_executions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "lead_id" TEXT,
    "playbook_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversion_playbook_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversion_playbook_executions_lead_id_playbook_id_key" ON "conversion_playbook_executions"("lead_id", "playbook_id");
CREATE INDEX "conversion_playbook_executions_user_id_idx" ON "conversion_playbook_executions"("user_id");
CREATE INDEX "conversion_playbook_executions_playbook_id_idx" ON "conversion_playbook_executions"("playbook_id");

ALTER TABLE "conversion_playbook_executions" ADD CONSTRAINT "conversion_playbook_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversion_playbook_executions" ADD CONSTRAINT "conversion_playbook_executions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversion_playbook_executions" ADD CONSTRAINT "conversion_playbook_executions_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "conversion_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed playbooks + steps
INSERT INTO "conversion_playbooks" ("id", "key", "name", "description") VALUES
('conv_pb_buyer', 'buyer_conversion', 'Buyer conversion', 'Browse → inquiry → high-intent close for property buyers.'),
('conv_pb_host', 'host_conversion', 'Host conversion', 'Interest → listed → active bookings for BNHub-style hosts.'),
('conv_pb_broker', 'broker_conversion', 'Broker conversion', 'Invite → active pipeline for broker partners.');

INSERT INTO "conversion_playbook_steps" ("id", "playbook_id", "step_order", "stage", "trigger_condition", "recommended_action", "message_template") VALUES
('conv_pb_buyer_s1', 'conv_pb_buyer', 1, 'browsing', 'crm_execution_stage in browsing, viewing_property', 'encourage inquiry', 'If something catches your eye, send one inquiry and I''ll help you move forward.'),
('conv_pb_buyer_s2', 'conv_pb_buyer', 2, 'inquiry_sent', 'inquiry_sent or broker_connected without booking', 'assign broker', 'I''ll connect you directly so you can get full details quickly.'),
('conv_pb_buyer_s3', 'conv_pb_buyer', 3, 'high_intent', 'intent_score high or booking_started or negotiation', 'push action', 'Do you want me to move this forward for you?'),

('conv_pb_host_s1', 'conv_pb_host', 1, 'interested', 'no listing yet', 'list property', 'Start by adding your property — I''ll help you get your first booking.'),
('conv_pb_host_s2', 'conv_pb_host', 2, 'listed', 'has published listing context', 'optimize', 'Let''s improve your listing to attract bookings faster.'),
('conv_pb_host_s3', 'conv_pb_host', 3, 'active', 'booking flow or high engagement', 'push booking', 'We''ll drive your first booking together.'),

('conv_pb_broker_s1', 'conv_pb_broker', 1, 'invited', 'new broker lead', 'accept leads', 'You''ll get direct serious inquiries — ready to test?'),
('conv_pb_broker_s2', 'conv_pb_broker', 2, 'active', 'contacted or qualified pipeline', 'respond fast', 'Fast responses = more deals.');
