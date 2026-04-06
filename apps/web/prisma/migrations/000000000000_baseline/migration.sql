-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('VISITOR', 'USER', 'CLIENT', 'TESTER', 'HOST', 'BROKER', 'MORTGAGE_EXPERT', 'DEVELOPER', 'ACCOUNTANT', 'ADMIN', 'BUYER', 'SELLER_DIRECT', 'MORTGAGE_BROKER', 'INVESTOR');

-- CreateEnum
CREATE TYPE "MarketplacePersona" AS ENUM ('UNSET', 'BUYER', 'SELLER_DIRECT', 'BROKER', 'MORTGAGE_BROKER');

-- CreateEnum
CREATE TYPE "BrokerStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BrokerPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BrokerTaxRegistrationStatus" AS ENUM ('SUBMITTED', 'FORMAT_VALID', 'PENDING_STAFF_REVIEW', 'MANUALLY_REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RevenueParty" AS ENUM ('PLATFORM', 'BROKER');

-- CreateEnum
CREATE TYPE "InvoiceIssuer" AS ENUM ('PLATFORM', 'BROKER');

-- CreateEnum
CREATE TYPE "PlatformInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'RESTRICTED', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FsboPhotoVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ListingAuthorityType" AS ENUM ('OWNER', 'BROKER');

-- CreateEnum
CREATE TYPE "ListingVerificationStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'PENDING_DOCUMENTS', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PropertyDocumentType" AS ENUM ('LAND_REGISTRY_EXTRACT', 'BROKER_AUTHORIZATION');

-- CreateEnum
CREATE TYPE "ListingCommissionCategory" AS ENUM ('SALE', 'RENT_LONG', 'RENT_SHORT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'AWAITING_HOST_APPROVAL', 'CONFIRMED', 'DECLINED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST', 'CANCELLED', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'UNLISTED', 'SUSPENDED', 'UNDER_INVESTIGATION', 'FROZEN', 'REJECTED_FOR_FRAUD', 'PERMANENTLY_REMOVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LecipmAiOperatorActionStatus" AS ENUM ('pending', 'suggested', 'approved', 'executed', 'failed', 'rejected');

-- CreateEnum
CREATE TYPE "lecipm_workspace_role" AS ENUM ('owner', 'admin', 'manager', 'broker', 'analyst', 'viewer', 'compliance_reviewer');

-- CreateEnum
CREATE TYPE "lecipm_workspace_invite_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "lecipm_deal_history_outcome" AS ENUM ('won', 'lost', 'canceled');

-- CreateEnum
CREATE TYPE "RentalListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RENTED');

-- CreateEnum
CREATE TYPE "RentalApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RentalLeaseStatus" AS ENUM ('PENDING_SIGNATURE', 'ACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "RentPaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE');

-- CreateEnum
CREATE TYPE "ImmoContactEventType" AS ENUM ('VIEW', 'CONTACT_CLICK', 'MESSAGE', 'CALL', 'BOOKING_REQUEST', 'DEAL_STARTED', 'CONTACT_FORM_SUBMITTED', 'CONVERSATION_STARTED', 'OFFER_STARTED', 'DEAL_LINKED');

-- CreateEnum
CREATE TYPE "FsboListingOwnerType" AS ENUM ('SELLER', 'BROKER');

-- CreateEnum
CREATE TYPE "SellerSupportingDocumentCategory" AS ENUM ('IDENTITY', 'INSPECTION_REPORT', 'RENOVATION_INVOICES', 'PERMITS_PLANS', 'CERTIFICATES_WARRANTIES', 'CONDO_DOCUMENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "SellerSupportingDocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiskAlertSeverity" AS ENUM ('HIGH', 'MEDIUM');

-- CreateEnum
CREATE TYPE "VerificationEntityType" AS ENUM ('LISTING', 'SELLER', 'BUYER', 'TENANT', 'GUEST', 'BROKER', 'BOOKING', 'OFFER', 'RENTAL_APPLICATION', 'MORTGAGE_FILE', 'SELLER_DECLARATION', 'HOST', 'SHORT_TERM_LISTING');

-- CreateEnum
CREATE TYPE "VerificationCaseStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'needs_info', 'escalated');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('low', 'medium', 'high', 'verified');

-- CreateEnum
CREATE TYPE "ReadinessLevel" AS ENUM ('not_ready', 'partial', 'ready', 'action_required');

-- CreateEnum
CREATE TYPE "VerificationSignalCategory" AS ENUM ('identity', 'address', 'media', 'legal', 'financial', 'behavior', 'fraud', 'compliance', 'quality');

-- CreateEnum
CREATE TYPE "VerificationSeverity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "VerificationSignalStatus" AS ENUM ('open', 'accepted', 'dismissed', 'resolved');

-- CreateEnum
CREATE TYPE "TrustProfileSubjectType" AS ENUM ('user', 'broker', 'listing', 'property_owner', 'host');

-- CreateEnum
CREATE TYPE "HumanReviewActionType" AS ENUM ('approve', 'reject', 'request_info', 'override_score', 'dismiss_signal', 'escalate', 'assign');

-- CreateEnum
CREATE TYPE "NextBestActionPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NextBestActionActorType" AS ENUM ('user', 'broker', 'admin', 'legal', 'system');

-- CreateEnum
CREATE TYPE "NextBestActionStatus" AS ENUM ('pending', 'completed', 'dismissed');

-- CreateEnum
CREATE TYPE "MediaVerificationJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "MediaVerificationType" AS ENUM ('exterior', 'interior', 'street', 'document', 'id', 'other');

-- CreateEnum
CREATE TYPE "TrustgraphExtractionSourceKind" AS ENUM ('seller_supporting_document', 'mortgage_request');

-- CreateEnum
CREATE TYPE "TrustgraphExtractionJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'needs_review');

-- CreateEnum
CREATE TYPE "TrustgraphFraudGraphNodeKind" AS ENUM ('user', 'listing', 'broker', 'upload', 'fingerprint', 'phone', 'email');

-- CreateEnum
CREATE TYPE "TrustgraphComplianceOrgType" AS ENUM ('brokerage', 'investor_firm', 'admin_internal', 'legal_team');

-- CreateEnum
CREATE TYPE "TrustgraphWorkspaceMemberRole" AS ENUM ('workspace_admin', 'workspace_manager', 'workspace_reviewer', 'workspace_legal_reviewer', 'workspace_viewer');

-- CreateEnum
CREATE TYPE "TrustgraphWorkspaceMemberStatus" AS ENUM ('active', 'suspended', 'invited');

-- CreateEnum
CREATE TYPE "TrustgraphSubscriptionStatus" AS ENUM ('active', 'trial', 'paused', 'canceled');

-- CreateEnum
CREATE TYPE "BnhubLuxuryTierCode" AS ENUM ('NONE', 'VERIFIED', 'PREMIUM', 'ELITE');

-- CreateEnum
CREATE TYPE "BnhubLuxuryEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'REVIEW_REQUIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BnhubTrustRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BnhubTrustProfileStatus" AS ENUM ('TRUSTED', 'REVIEW_REQUIRED', 'RESTRICTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BnhubFraudFlagType" AS ENUM ('ADDRESS_MISMATCH', 'SUSPICIOUS_PRICE', 'DUPLICATE_LISTING', 'MISSING_EXTERIOR_PHOTO', 'SUSPICIOUS_IMAGES', 'REPEATED_CONTACT_PATTERN', 'UNVERIFIABLE_HOST', 'INCONSISTENT_METADATA', 'ABNORMAL_BEHAVIOR', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "BnhubFraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BnhubFraudFlagStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "BnhubTrustIdentityUserRole" AS ENUM ('HOST', 'GUEST', 'ADMIN', 'SERVICE_PROVIDER');

-- CreateEnum
CREATE TYPE "BnhubTrustIdentityProvider" AS ENUM ('STRIPE_IDENTITY', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BnhubTrustIdentitySessionStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'REQUIRES_INPUT', 'VERIFIED', 'FAILED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BnhubTrustGeocodeProvider" AS ENUM ('GOOGLE_GEOCODING', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BnhubTrustGeocodeStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL_MATCH', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "BnhubTrustStreetviewCompareStatus" AS ENUM ('NOT_RUN', 'PENDING', 'MATCHED', 'WEAK_MATCH', 'NO_REFERENCE', 'FAILED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "BnhubTrustPayoutGateStatus" AS ENUM ('NONE', 'HOLD', 'RELEASE_BLOCKED');

-- CreateEnum
CREATE TYPE "BnhubTrustPromotionGateStatus" AS ENUM ('ELIGIBLE', 'REVIEW_REQUIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BnhubTrustRiskFlagTypeV2" AS ENUM ('IDENTITY_INCOMPLETE', 'ADDRESS_MISMATCH', 'SUSPICIOUS_PRICE', 'DUPLICATE_LISTING', 'REPEATED_MEDIA', 'MISSING_EXTERIOR_PHOTO', 'UNVERIFIABLE_LOCATION', 'ABNORMAL_BEHAVIOR', 'MANUAL_REVIEW', 'RESTRICTED_ZONE', 'PAYMENT_RISK');

-- CreateEnum
CREATE TYPE "BnhubTrustRiskFlagVisibility" AS ENUM ('ADMIN_ONLY', 'SAFE_HOST_VISIBLE');

-- CreateEnum
CREATE TYPE "BnhubTrustLocationPolicyStatus" AS ENUM ('PENDING', 'APPROVED', 'MANUAL_REVIEW_REQUIRED', 'RESTRICTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BnhubTrustZonePolicyResult" AS ENUM ('CLEAR', 'REVIEW_REQUIRED', 'RESTRICTED_ZONE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BnhubTrustAccessSafetyResult" AS ENUM ('CLEAR', 'REVIEW_REQUIRED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BnhubTrustRestrictedZoneAction" AS ENUM ('REVIEW_REQUIRED', 'RESTRICTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BnhubTrustIdentityAuditActor" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'WEBHOOK', 'HOST');

-- CreateEnum
CREATE TYPE "BnhubPricingScopeType" AS ENUM ('GLOBAL', 'CITY', 'LISTING', 'HOST');

-- CreateEnum
CREATE TYPE "BnhubPricingRuleType" AS ENUM ('WEEKEND_MULTIPLIER', 'OCCUPANCY_DEMAND', 'MIN_GUARDRAIL', 'MAX_GUARDRAIL', 'PREMIUM_BONUS', 'EVENT_BONUS', 'SEASONAL_SHIFT', 'TRUST_PENALTY', 'FRAUD_LOCK');

-- CreateEnum
CREATE TYPE "BnhubPricingHistorySource" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'HOST');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('MATCH', 'PARTIAL_MATCH', 'MISMATCH');

-- CreateEnum
CREATE TYPE "BnhubChannelPlatform" AS ENUM ('BOOKING_COM', 'AIRBNB', 'EXPEDIA', 'VRBO', 'DIRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "BnhubChannelConnectionType" AS ENUM ('ICAL', 'API');

-- CreateEnum
CREATE TYPE "BnhubChannelConnectionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "BnhubChannelListingMapStatus" AS ENUM ('LINKED', 'PENDING', 'ERROR');

-- CreateEnum
CREATE TYPE "BnhubChannelEventSource" AS ENUM ('BNHUB', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "BnhubChannelEventKind" AS ENUM ('RESERVATION', 'BLOCK', 'AVAILABILITY_UPDATE');

-- CreateEnum
CREATE TYPE "BnhubOtaSyncType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "BnhubOtaSyncResultStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "BnhubDayAvailabilityStatus" AS ENUM ('AVAILABLE', 'BLOCKED', 'BOOKED');

-- CreateEnum
CREATE TYPE "BnhubBookingSource" AS ENUM ('LOCAL', 'AIRBNB', 'BOOKING_COM', 'EXPEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "BnhubChannelSyncStatus" AS ENUM ('IDLE', 'OK', 'ERROR', 'SYNCING');

-- CreateEnum
CREATE TYPE "BnhubMpAccountRole" AS ENUM ('HOST', 'PLATFORM');

-- CreateEnum
CREATE TYPE "BnhubMpProcessor" AS ENUM ('STRIPE');

-- CreateEnum
CREATE TYPE "BnhubMpOnboardingStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'ACTIVE', 'RESTRICTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BnhubMpVerificationState" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BnhubMpReservationPaymentStatus" AS ENUM ('DRAFT', 'REQUIRES_ACTION', 'PROCESSING', 'AUTHORIZED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "BnhubMpCaptureMode" AS ENUM ('AUTOMATIC', 'MANUAL', 'PARTIAL_CAPTURE_READY');

-- CreateEnum
CREATE TYPE "BnhubMpFundsFlow" AS ENUM ('DESTINATION_CHARGE', 'SEPARATE_CHARGE_TRANSFER', 'MANUAL_RELEASE');

-- CreateEnum
CREATE TYPE "BnhubMpRiskHold" AS ENUM ('NONE', 'HELD', 'UNDER_REVIEW', 'RELEASE_BLOCKED');

-- CreateEnum
CREATE TYPE "BnhubMpPayoutStatus" AS ENUM ('PENDING', 'SCHEDULED', 'HELD', 'IN_TRANSIT', 'PAID', 'FAILED', 'REVERSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubMpHoldType" AS ENUM ('RISK_HOLD', 'DISPUTE_HOLD', 'PAYOUT_RESERVE', 'SECURITY_HOLD', 'COMPLIANCE_HOLD');

-- CreateEnum
CREATE TYPE "BnhubMpHoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubMpRefundType" AS ENUM ('FULL', 'PARTIAL', 'CANCELLATION', 'GOODWILL', 'DISPUTE_RESOLUTION');

-- CreateEnum
CREATE TYPE "BnhubMpRefundStatus" AS ENUM ('DRAFT', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubMpDisputeStatus" AS ENUM ('OPEN', 'WARNING_NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "BnhubMpPaymentEventActor" AS ENUM ('SYSTEM', 'GUEST', 'HOST', 'ADMIN', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "BnhubMpLedgerEntity" AS ENUM ('PAYMENT', 'PAYOUT', 'REFUND', 'FEE', 'RESERVE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BnhubMpLedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BnhubMpWebhookInboxStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "BnhubGuaranteeStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'SUBMITTED', 'UNDER_REVIEW', 'WAITING_FOR_HOST_RESPONSE', 'EVIDENCE_REVIEW', 'RESOLVED', 'RESOLVED_PARTIAL_REFUND', 'RESOLVED_FULL_REFUND', 'RESOLVED_RELOCATION', 'REJECTED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeClaimant" AS ENUM ('GUEST', 'HOST');

-- CreateEnum
CREATE TYPE "FraudSignalType" AS ENUM ('FAKE_LISTING', 'SUSPICIOUS_BOOKING', 'PAYMENT_FRAUD', 'ACCOUNT_TAKEOVER', 'REVIEW_MANIPULATION', 'REFUND_ABUSE', 'SUSPICIOUS_MESSAGING');

-- CreateEnum
CREATE TYPE "FraudAlertStatus" AS ENUM ('NEW', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLOSED');

-- CreateEnum
CREATE TYPE "ListingFraudEnforcementType" AS ENUM ('REJECT_LISTING', 'PERMANENTLY_REMOVE_LISTING', 'SUSPEND_LISTING_ACCOUNT', 'BAN_USER_ACCOUNT', 'BLOCK_FUTURE_LISTING', 'FREEZE_PAYOUTS', 'FRAUD_MARKER_PROPERTY_IDENTITY', 'REQUIRE_STRONGER_VERIFICATION');

-- CreateEnum
CREATE TYPE "PayoutHoldStatus" AS ENUM ('PENDING', 'ON_HOLD', 'RELEASABLE', 'RELEASED', 'REVERSED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OperationalControlType" AS ENUM ('KILL_SWITCH', 'PAYOUT_HOLD', 'LISTING_FREEZE', 'BOOKING_RESTRICTION', 'MODERATION_LEVEL', 'REGIONAL_LOCK');

-- CreateEnum
CREATE TYPE "SystemAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PolicyRuleType" AS ENUM ('ELIGIBILITY', 'VISIBILITY', 'RELEASE_CONDITION', 'VERIFICATION', 'AUTO_BLOCK', 'CANCELLATION', 'REVIEW_ELIGIBILITY', 'REFERRAL_REWARD');

-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('ALLOW', 'DENY', 'HOLD', 'REQUIRE_ACTION');

-- CreateEnum
CREATE TYPE "SubscriptionPlanModule" AS ENUM ('BROKER_CRM', 'HOST_PRO', 'OWNER_ANALYTICS', 'INVESTOR_ANALYTICS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused');

-- CreateEnum
CREATE TYPE "billing_event_type" AS ENUM ('checkout_completed', 'subscription_created', 'subscription_updated', 'subscription_deleted', 'invoice_payment_failed', 'invoice_paid');

-- CreateEnum
CREATE TYPE "copilot_message_role" AS ENUM ('user', 'assistant', 'system', 'tool');

-- CreateEnum
CREATE TYPE "copilot_intent" AS ENUM ('find_deals', 'analyze_property', 'improve_listing', 'why_not_selling', 'portfolio_summary', 'pricing_help', 'risk_check', 'unknown');

-- CreateEnum
CREATE TYPE "copilot_run_status" AS ENUM ('queued', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "PromotionPlacement" AS ENUM ('FEATURED', 'SPONSORED', 'BOOST');

-- CreateEnum
CREATE TYPE "PromotionCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "BnhubMarketingCampaignObjective" AS ENUM ('AWARENESS', 'TRAFFIC', 'LEAD_GENERATION', 'BOOKING_CONVERSION', 'BRAND_BUILDING');

-- CreateEnum
CREATE TYPE "BnhubMarketingCampaignStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "BnhubMarketingBudgetMode" AS ENUM ('NONE', 'INTERNAL_ONLY', 'ESTIMATED', 'PAID_EXTERNAL');

-- CreateEnum
CREATE TYPE "BnhubMarketingAssetType" AS ENUM ('HEADLINE', 'CAPTION', 'LONG_DESCRIPTION', 'SEO_TITLE', 'SEO_META', 'EMAIL_COPY', 'SOCIAL_POST', 'AD_COPY', 'BROCHURE_TEXT', 'BLOG_FEED_CARD');

-- CreateEnum
CREATE TYPE "BnhubMarketingTone" AS ENUM ('LUXURY', 'PROFESSIONAL', 'FRIENDLY', 'DIRECT', 'PREMIUM', 'INVESTOR');

-- CreateEnum
CREATE TYPE "BnhubDistributionChannelType" AS ENUM ('INTERNAL', 'EXTERNAL', 'EXPORT');

-- CreateEnum
CREATE TYPE "BnhubCampaignDistributionStatus" AS ENUM ('DRAFT', 'QUEUED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubMarketingEventType" AS ENUM ('GENERATED', 'EDITED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CLICKED', 'LEAD', 'BOOKING', 'RECOMMENDATION_APPLIED');

-- CreateEnum
CREATE TYPE "BnhubMarketingEventSource" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'HOST');

-- CreateEnum
CREATE TYPE "BnhubMarketingRecommendationType" AS ENUM ('CHANNEL', 'TIMING', 'CREATIVE', 'PRICING', 'PHOTO_UPGRADE', 'DESCRIPTION_UPGRADE', 'HOMEPAGE_BOOST');

-- CreateEnum
CREATE TYPE "BnhubMarketingRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BnhubMarketingRecommendationStatus" AS ENUM ('OPEN', 'APPLIED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "BnhubEmailCampaignQueueStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubGrowthAutonomyLevel" AS ENUM ('OFF', 'ASSISTED', 'SUPERVISED_AUTOPILOT', 'FULL_AUTOPILOT');

-- CreateEnum
CREATE TYPE "BnhubGrowthCampaignType" AS ENUM ('LISTING_PROMO', 'DESTINATION_PROMO', 'SEASONAL', 'RETARGETING', 'LEAD_GEN', 'BOOKING_CONVERSION');

-- CreateEnum
CREATE TYPE "BnhubGrowthCampaignObjective" AS ENUM ('AWARENESS', 'TRAFFIC', 'LEADS', 'INQUIRIES', 'BOOKING_CONVERSION', 'HOST_ACQUISITION');

-- CreateEnum
CREATE TYPE "BnhubGrowthCampaignStatus" AS ENUM ('DRAFT', 'READY', 'AWAITING_APPROVAL', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BnhubGrowthBudgetMode" AS ENUM ('MANUAL', 'AI_RECOMMENDED', 'CAPPED_AUTOPILOT');

-- CreateEnum
CREATE TYPE "BnhubGrowthAssetFamily" AS ENUM ('HEADLINE', 'CAPTION', 'SOCIAL_PRIMARY', 'SOCIAL_VARIANT', 'AD_PRIMARY', 'AD_VARIANT', 'LANDING_COPY', 'EMAIL_COPY', 'WHATSAPP_COPY', 'SEO_TITLE', 'SEO_META');

-- CreateEnum
CREATE TYPE "BnhubGrowthAssetApprovalStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BnhubGrowthConnectorType" AS ENUM ('ADS', 'MESSAGING', 'INTERNAL', 'EXPORT');

-- CreateEnum
CREATE TYPE "BnhubGrowthConnectorStatus" AS ENUM ('INACTIVE', 'SETUP_REQUIRED', 'ACTIVE', 'ERROR', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BnhubGrowthDistributionStatus" AS ENUM ('DRAFT', 'QUEUED', 'AWAITING_APPROVAL', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubLeadSourceType" AS ENUM ('INTERNAL_FORM', 'META_LEAD', 'GOOGLE_LEAD', 'TIKTOK_LEAD', 'WHATSAPP_MESSAGE', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "BnhubLeadType" AS ENUM ('GUEST_BOOKING', 'SHORT_TERM_INQUIRY', 'HOST_SIGNUP', 'BROKER_LEAD', 'INVESTOR_LEAD');

-- CreateEnum
CREATE TYPE "BnhubLeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "BnhubLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'SPAM');

-- CreateEnum
CREATE TYPE "BnhubLeadEventType" AS ENUM ('CREATED', 'SYNCED', 'SCORED', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED', 'SPAM_FLAGGED');

-- CreateEnum
CREATE TYPE "BnhubLeadEventSource" AS ENUM ('SYSTEM', 'AI', 'CONNECTOR', 'ADMIN', 'HOST');

-- CreateEnum
CREATE TYPE "BnhubGrowthEngineRecommendationType" AS ENUM ('LAUNCH', 'CHANNEL_SHIFT', 'BUDGET_SHIFT', 'COPY_REFRESH', 'CREATIVE_REFRESH', 'LANDING_FIX', 'PRICING_FIX', 'PAUSE_CAMPAIGN', 'BOOST_INTERNAL', 'WHATSAPP_FOLLOWUP');

-- CreateEnum
CREATE TYPE "BnhubGrowthEngineRecommendationStatus" AS ENUM ('OPEN', 'APPLIED', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BnhubGrowthEngineRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BnhubGrowthRuleScopeType" AS ENUM ('GLOBAL', 'HOST', 'LISTING', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "BnhubGrowthRuleTriggerType" AS ENUM ('LISTING_APPROVED', 'DAILY_SCAN', 'LEAD_DROP', 'LOW_CTR', 'HIGH_CPL', 'HIGH_CONVERSION', 'NO_EXTERIOR_PHOTO', 'NO_RESPONSE', 'ABANDONED_INQUIRY');

-- CreateEnum
CREATE TYPE "BnhubConnectorTokenOwnerType" AS ENUM ('SYSTEM', 'ADMIN', 'HOST');

-- CreateEnum
CREATE TYPE "BnhubConnectorTokenStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'ROTATING');

-- CreateEnum
CREATE TYPE "BnhubGrowthAuditActorType" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'HOST', 'CONNECTOR_WEBHOOK');

-- CreateEnum
CREATE TYPE "GrowthCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('ONBOARDING', 'ACTIVE', 'AT_RISK', 'CHURNED', 'REACTIVATED');

-- CreateEnum
CREATE TYPE "RevenueLedgerType" AS ENUM ('BOOKING_COMMISSION', 'REAL_ESTATE_COMMISSION', 'SUBSCRIPTION', 'PROMOTION', 'REFERRAL_COST', 'REFUND', 'CHARGEBACK', 'INCENTIVE', 'PAYOUT');

-- CreateEnum
CREATE TYPE "AiAlertType" AS ENUM ('FRAUD_SPIKE', 'DISPUTE_SPIKE', 'LISTING_QUALITY_DROP', 'CANCELLATION_ANOMALY', 'DEMAND_CHANGE', 'REGIONAL_RISK', 'MODEL_DRIFT');

-- CreateEnum
CREATE TYPE "AdminReportPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AbuseSignalType" AS ENUM ('REPEAT_OFFENDER', 'LINKED_ACCOUNT', 'EVASION_AFTER_SUSPENSION', 'ABUSIVE_MESSAGING', 'ABUSIVE_BOOKING', 'REFUND_ABUSE', 'PROMOTION_ABUSE', 'REFERRAL_ABUSE', 'BAN_EVASION');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CrisisSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EnforcementActionType" AS ENUM ('WARNING', 'TEMPORARY_RESTRICTION', 'LISTING_FREEZE', 'BOOKING_LIMITATION', 'PAYOUT_HOLD', 'ACCOUNT_SUSPENSION', 'PERMANENT_BAN', 'MARKET_SPECIFIC');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TrustSafetyIncidentStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'WAITING_RESPONSE', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TrustSafetySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TrustSafetyRiskLevel" AS ENUM ('LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'CRITICAL_RISK');

-- CreateEnum
CREATE TYPE "TrustSafetyActionType" AS ENUM ('WARNING', 'LISTING_WARNING', 'BOOKING_RESTRICTION', 'PAYOUT_HOLD', 'LISTING_FREEZE', 'ACCOUNT_SUSPENSION', 'PERMANENT_LISTING_REMOVAL', 'PERMANENT_ACCOUNT_BAN', 'REFUND', 'ADDITIONAL_VERIFICATION_REQUIRED', 'MANUAL_REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "TrustSafetyAppealStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "LeadContactOrigin" AS ENUM ('IMMO_CONTACT', 'PLATFORM_BROKER', 'DIRECT', 'BUYER');

-- CreateEnum
CREATE TYPE "EarlyUserTrackingType" AS ENUM ('HOST', 'GUEST');

-- CreateEnum
CREATE TYPE "EarlyUserTrackingStatus" AS ENUM ('CONTACTED', 'REPLIED', 'SIGNED_UP', 'ONBOARDED');

-- CreateEnum
CREATE TYPE "LeadPriorityTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EnterpriseLeadSegment" AS ENUM ('PROPERTY_MANAGEMENT', 'REAL_ESTATE_AGENCY', 'MULTI_PROPERTY_HOST', 'STR_OPERATOR', 'TRAVEL_BUSINESS');

-- CreateEnum
CREATE TYPE "EnterpriseLeadStage" AS ENUM ('LEAD_IDENTIFIED', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "UserEventType" AS ENUM ('ANALYZE', 'SAVE_DEAL', 'COMPARE', 'VISIT_PAGE', 'WAITLIST_SIGNUP', 'RETURN_VISIT', 'SIGNUP', 'LOGIN', 'LISTING_VIEW', 'FAVORITE', 'INQUIRY', 'BOOKING_START', 'CHECKOUT_START', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'STRIPE_WEBHOOK');

-- CreateEnum
CREATE TYPE "GrowthEmailQueueType" AS ENUM ('WELCOME', 'REMINDER', 'FOLLOWUP');

-- CreateEnum
CREATE TYPE "GrowthEmailQueueStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OfferEventType" AS ENUM ('CREATED', 'SUBMITTED', 'STATUS_CHANGED', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "BrokerClientStatus" AS ENUM ('LEAD', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'NEGOTIATING', 'UNDER_CONTRACT', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "BrokerInteractionType" AS ENUM ('NOTE', 'EMAIL', 'CALL', 'MEETING', 'TASK', 'FOLLOW_UP', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "BrokerClientListingKind" AS ENUM ('SAVED', 'SHARED', 'VIEWED', 'FAVORITE');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('PROPERTY_VISIT', 'CALL', 'MEETING', 'CONSULTATION', 'DOCUMENT_REVIEW', 'OFFER_DISCUSSION', 'CONTRACT_SIGNING');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MeetingMode" AS ENUM ('IN_PERSON', 'PHONE', 'VIDEO');

-- CreateEnum
CREATE TYPE "AppointmentEventType" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'NOTE_ADDED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'LISTING', 'OFFER', 'CONTRACT', 'APPOINTMENT', 'CLIENT_THREAD', 'SUPPORT');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM', 'NOTE');

-- CreateEnum
CREATE TYPE "MessageEventType" AS ENUM ('CONVERSATION_CREATED', 'PARTICIPANT_ADDED', 'MESSAGE_SENT', 'MESSAGE_EDITED', 'MESSAGE_DELETED', 'CONVERSATION_ARCHIVED', 'READ');

-- CreateEnum
CREATE TYPE "DocumentFolderType" AS ENUM ('GENERAL', 'LISTING_ROOM', 'CLIENT_ROOM', 'OFFER_ROOM', 'CONTRACT_ROOM', 'APPOINTMENT_ROOM', 'CONVERSATION_ROOM');

-- CreateEnum
CREATE TYPE "DocumentFileStatus" AS ENUM ('UPLOADING', 'AVAILABLE', 'ARCHIVED', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PRIVATE_INTERNAL', 'SHARED_PARTICIPANTS', 'BROKER_ONLY', 'CLIENT_VISIBLE', 'ADMIN_ONLY');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('IDENTITY', 'FINANCIAL', 'CONTRACT', 'DISCLOSURE', 'PROPERTY', 'APPOINTMENT', 'MESSAGE_ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentAccessLevel" AS ENUM ('VIEW', 'COMMENT', 'EDIT', 'MANAGE');

-- CreateEnum
CREATE TYPE "DocumentEventType" AS ENUM ('FOLDER_CREATED', 'FILE_UPLOADED', 'FILE_RENAMED', 'FILE_MOVED', 'FILE_ARCHIVED', 'FILE_DELETED', 'FILE_SHARED', 'FILE_VIEWED', 'FILE_DOWNLOADED', 'ACCESS_CHANGED');

-- CreateEnum
CREATE TYPE "ClientIntakeStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETE', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "RequiredDocumentCategory" AS ENUM ('IDENTITY', 'INCOME', 'BANKING', 'TAX', 'RESIDENCY', 'CREDIT', 'EMPLOYMENT', 'CORPORATE', 'PROPERTY', 'OTHER');

-- CreateEnum
CREATE TYPE "RequiredDocumentStatus" AS ENUM ('REQUIRED', 'REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAIVED');

-- CreateEnum
CREATE TYPE "ClientIntakeEventType" AS ENUM ('INTAKE_CREATED', 'INTAKE_UPDATED', 'STATUS_CHANGED', 'DOCUMENT_REQUESTED', 'DOCUMENT_UPLOADED', 'DOCUMENT_LINKED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'DOCUMENT_WAIVED', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'OFFER', 'CONTRACT', 'APPOINTMENT', 'DOCUMENT', 'INTAKE', 'CRM', 'SYSTEM', 'TASK', 'REMINDER', 'FINANCE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ActionQueueItemType" AS ENUM ('REVIEW_DOCUMENT', 'REVIEW_OFFER', 'REVIEW_CONTRACT', 'RESPOND_MESSAGE', 'CONFIRM_APPOINTMENT', 'FOLLOW_UP_CLIENT', 'COMPLETE_INTAKE', 'SIGN_CONTRACT', 'UPLOAD_REQUIRED_DOCUMENT', 'REVIEW_COUNTER_OFFER', 'INTERNAL_TASK', 'SYSTEM_ACTION', 'REVIEW_COMMISSION', 'ISSUE_INVOICE', 'RECORD_PAYMENT', 'FOLLOW_UP_OVERDUE_INVOICE');

-- CreateEnum
CREATE TYPE "ActionQueueItemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'DISMISSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('CREATED', 'READ', 'ARCHIVED', 'ACTION_COMPLETED', 'ACTION_DISMISSED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('TENANT_OWNER', 'TENANT_ADMIN', 'BROKER', 'ASSISTANT', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "TenantMembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenantInvoiceType" AS ENUM ('COMMISSION', 'SERVICE_FEE', 'BROKER_FEE', 'PLATFORM_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "TenantInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentRecordType" AS ENUM ('INCOMING', 'OUTGOING', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SellerDeclarationDraftStatus" AS ENUM ('draft', 'in_review', 'needs_changes', 'ready', 'finalized', 'approved', 'exported', 'signed');

-- CreateEnum
CREATE TYPE "DocumentSignatureStatus" AS ENUM ('pending', 'viewed', 'signed', 'declined');

-- CreateEnum
CREATE TYPE "LegalGraphIssueStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "LegalGraphIssueSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentType" AS ENUM ('law', 'drafting', 'internal');

-- CreateEnum
CREATE TYPE "KnowledgeChunkSemanticType" AS ENUM ('declaration', 'obligation', 'clause', 'process');

-- CreateEnum
CREATE TYPE "KnowledgeChunkAudience" AS ENUM ('seller', 'buyer', 'broker', 'transaction');

-- CreateEnum
CREATE TYPE "KnowledgeChunkImportance" AS ENUM ('mandatory', 'optional');

-- CreateEnum
CREATE TYPE "AutoDraftingActionType" AS ENUM ('generate', 'section', 'clause', 'rewrite_notes', 'follow_up', 'review_summary');

-- CreateEnum
CREATE TYPE "AutonomousWorkflowTaskStatus" AS ENUM ('pending', 'approved', 'dismissed', 'completed', 'blocked');

-- CreateEnum
CREATE TYPE "WorkflowAutomationEventStatus" AS ENUM ('success', 'skipped', 'blocked', 'failed', 'pending', 'completed', 'dismissed', 'approved');

-- CreateEnum
CREATE TYPE "ModelValidationRunStatus" AS ENUM ('draft', 'in_progress', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "ModelValidationRunKind" AS ENUM ('baseline', 'tuned_same_set', 'tuned_fresh_set');

-- CreateEnum
CREATE TYPE "CalibrationBatchStatus" AS ENUM ('draft', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "CalibrationDriftSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "CalibrationDriftAlertStatus" AS ENUM ('open', 'acknowledged', 'dismissed');

-- CreateEnum
CREATE TYPE "lead_marketplace_status" AS ENUM ('available', 'reserved', 'sold', 'withdrawn');

-- CreateEnum
CREATE TYPE "daily_deal_feed_interaction_type" AS ENUM ('viewed', 'saved', 'ignored', 'analyzed', 'contacted', 'clicked', 'dismissed');

-- CreateEnum
CREATE TYPE "watchlist_alert_status" AS ENUM ('unread', 'read', 'dismissed');

-- CreateEnum
CREATE TYPE "watchlist_alert_severity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "watchlist_alert_type" AS ENUM ('price_changed', 'deal_score_up', 'deal_score_down', 'trust_score_changed', 'fraud_risk_up', 'confidence_up', 'confidence_down', 'listing_status_changed', 'strong_opportunity_detected', 'needs_review_detected');

-- CreateEnum
CREATE TYPE "negotiation_chain_status" AS ENUM ('active', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "negotiation_version_role" AS ENUM ('buyer', 'seller', 'broker');

-- CreateEnum
CREATE TYPE "negotiation_version_status" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "GrowthMarketingPlatform" AS ENUM ('INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'TIKTOK', 'BLOG', 'EMAIL');

-- CreateEnum
CREATE TYPE "GrowthMarketingChannelStatus" AS ENUM ('PENDING', 'CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "GrowthContentItemStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "lecipm_conversion_subscription_status" AS ENUM ('trial', 'active', 'past_due', 'canceled', 'incomplete', 'expired');

-- CreateEnum
CREATE TYPE "BnhubSafetyReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'RESTRICTED', 'REJECTED', 'MANUAL_REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "BnhubSafetyFlagStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "BnhubSafetyFlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "BnhubMobileNotificationChannel" AS ENUM ('PUSH', 'IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "BnhubMobileNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubReviewModerationStatus" AS ENUM ('VISIBLE', 'PENDING', 'HIDDEN');

-- CreateEnum
CREATE TYPE "BnhubAddonServiceCategory" AS ENUM ('TRANSPORT', 'FOOD', 'CLEANING', 'CONVENIENCE', 'EXPERIENCE', 'ACCESS', 'HOSPITALITY', 'CONCIERGE');

-- CreateEnum
CREATE TYPE "BnhubServiceScope" AS ENUM ('LISTING_HOSTED', 'PLATFORM_MANAGED', 'PARTNER_MANAGED', 'REQUEST_ONLY');

-- CreateEnum
CREATE TYPE "BnhubCatalogPricingBehavior" AS ENUM ('FREE', 'FIXED', 'PER_DAY', 'PER_GUEST', 'PER_BOOKING', 'QUOTE_REQUIRED');

-- CreateEnum
CREATE TYPE "BnhubListingServicePricingType" AS ENUM ('FREE', 'FIXED', 'PER_DAY', 'PER_GUEST', 'PER_BOOKING', 'QUOTE_REQUIRED');

-- CreateEnum
CREATE TYPE "BnhubListingServiceModerationStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'RESTRICTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BnhubBookingServiceLineStatus" AS ENUM ('REQUESTED', 'PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BnhubServiceSelectedFrom" AS ENUM ('BOOKING_FLOW', 'POST_BOOKING', 'CONCIERGE', 'BUNDLE');

-- CreateEnum
CREATE TYPE "BnhubServiceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubServiceRequestType" AS ENUM ('SERVICE_REQUEST', 'CONCIERGE_REQUEST', 'EARLY_CHECKIN', 'LATE_CHECKOUT', 'TRANSPORT_QUOTE', 'CUSTOM_REQUEST');

-- CreateEnum
CREATE TYPE "BnhubBundleTargetSegment" AS ENUM ('ROMANTIC', 'FAMILY', 'BUSINESS', 'LUXURY', 'LONG_STAY', 'ARRIVAL', 'WELLNESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BnhubBundlePricingType" AS ENUM ('FIXED', 'DYNAMIC', 'MIXED');

-- CreateEnum
CREATE TYPE "BnhubBundleVisibilityScope" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'HOST_SELECTED', 'ADMIN_SELECTED');

-- CreateEnum
CREATE TYPE "BnhubBookingBundleStatus" AS ENUM ('SELECTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubConciergeRoleContext" AS ENUM ('GUEST', 'HOST', 'ADMIN');

-- CreateEnum
CREATE TYPE "BnhubConciergeSessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "BnhubConciergeAiMode" AS ENUM ('MOCK', 'FALLBACK', 'PROVIDER');

-- CreateEnum
CREATE TYPE "BnhubConciergeSenderType" AS ENUM ('USER', 'AI', 'ADMIN', 'HOST');

-- CreateEnum
CREATE TYPE "BnhubConciergeMessageType" AS ENUM ('TEXT', 'RECOMMENDATION', 'BUNDLE_OFFER', 'SERVICE_OFFER', 'ESCALATION_NOTE');

-- CreateEnum
CREATE TYPE "BnhubMembershipAudienceType" AS ENUM ('GUEST', 'HOST', 'UNIVERSAL');

-- CreateEnum
CREATE TYPE "BnhubMembershipBillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "BnhubUserMembershipStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAUSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BnhubMembershipRenewalMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "BnhubProviderType" AS ENUM ('HOST', 'PARTNER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "BnhubProviderVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BnhubHospitalitySafetyScopeType" AS ENUM ('GLOBAL', 'LISTING', 'HOST', 'REGION', 'SAFETY_STATUS');

-- CreateEnum
CREATE TYPE "BnhubHospitalityAuditActorType" AS ENUM ('SYSTEM', 'AI', 'GUEST', 'HOST', 'ADMIN');

-- CreateEnum
CREATE TYPE "BnhubTravelProductType" AS ENUM ('HOTEL', 'TRANSPORT', 'FLIGHT', 'ACTIVITY', 'PARTNER_SERVICE');

-- CreateEnum
CREATE TYPE "BnhubTravelProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESTRICTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "platform_code_sequences" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "next_value" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_code_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "broker_status" "BrokerStatus" NOT NULL DEFAULT 'NONE',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "user_code" TEXT,
    "two_factor_email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "email_verification_token" TEXT,
    "email_verification_expires" TIMESTAMP(3),
    "name" TEXT,
    "phone" TEXT,
    "home_city" TEXT,
    "home_region" TEXT,
    "home_country" TEXT,
    "lecipm_city_id" TEXT,
    "seller_profile_address" TEXT,
    "seller_hub_onboarding_json" JSONB,
    "seller_selling_mode" TEXT,
    "seller_onboarding_completed_at" TIMESTAMP(3),
    "seller_legal_accuracy_accepted_at" TIMESTAMP(3),
    "referralCode" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "marketplace_persona" "MarketplacePersona" NOT NULL DEFAULT 'UNSET',
    "seller_plan" TEXT,
    "stripe_account_id" TEXT,
    "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "growth_outreach_segment" TEXT,
    "growth_last_contact_at" TIMESTAMP(3),
    "growth_follow_up_due_at" TIMESTAMP(3),
    "growth_follow_up_sent_at" TIMESTAMP(3),
    "growth_messaging_paused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "is_retarget_candidate" BOOLEAN NOT NULL DEFAULT false,
    "investment_mvp_analyze_count" INTEGER NOT NULL DEFAULT 0,
    "investment_mvp_first_analyze_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" UUID,
    "type" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "LecipmAiOperatorActionStatus" NOT NULL DEFAULT 'suggested',
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "data_used_summary" TEXT,
    "expected_outcome" TEXT,
    "suggested_execution" JSONB,
    "result_log" JSONB,
    "edited_payload" JSONB,
    "autonomy_mode_at_create" TEXT,
    "outcome_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_ai_operator_settings" (
    "user_id" TEXT NOT NULL,
    "autonomy_mode" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_ai_operator_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "avatar_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "video_base_url" TEXT NOT NULL,
    "voice_profile_id" TEXT,
    "style_config" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_user_explainer_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_url" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_user_explainer_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "settings" JSONB,
    "seat_limit" INTEGER NOT NULL DEFAULT 10,
    "plan_tier" TEXT NOT NULL DEFAULT 'team',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enterprise_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_workspace_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "lecipm_workspace_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enterprise_workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_workspace_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "lecipm_workspace_role" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "lecipm_workspace_invite_status" NOT NULL DEFAULT 'pending',
    "invited_by_user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "deal_id" TEXT NOT NULL,
    "outcome" "lecipm_deal_history_outcome" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "timeline" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_broker_reputation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deals_counted" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_broker_reputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_deal_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "deal_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_deal_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_collaboration_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "deal_id" TEXT,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_collaboration_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "referred_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_date" DATE NOT NULL,
    "task_type" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "replies_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "replies_received" INTEGER NOT NULL DEFAULT 0,
    "calls_booked" INTEGER NOT NULL DEFAULT 0,
    "users_onboarded" INTEGER NOT NULL DEFAULT 0,
    "variant_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_scripts" (
    "id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "performance_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "region_slug" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'investor',
    "analysis_window_days" INTEGER NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "median_price_cents" BIGINT,
    "median_price_per_sqft" DECIMAL(18,2),
    "active_listing_count" INTEGER NOT NULL DEFAULT 0,
    "new_listing_count" INTEGER NOT NULL DEFAULT 0,
    "confidence_level" TEXT NOT NULL,
    "direction_label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshot_date" DATE NOT NULL,
    "mrr" DECIMAL(18,2),
    "churn_rate" DECIMAL(12,8),
    "ltv" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_email_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "trigger_key" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "subject" TEXT,
    "body_preview" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_license_policy" (
    "id" TEXT NOT NULL,
    "current_version" TEXT NOT NULL DEFAULT '1.0.0',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" TEXT,

    CONSTRAINT "content_license_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_license_acceptances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_license_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_listings" (
    "id" TEXT NOT NULL,
    "listing_code" TEXT NOT NULL,
    "landlord_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_monthly" INTEGER NOT NULL,
    "deposit_amount" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "status" "RentalListingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_applications" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "RentalApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "legal_accepted_at" TIMESTAMP(3),
    "documents_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_leases" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "landlord_id" TEXT NOT NULL,
    "application_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "monthly_rent" INTEGER NOT NULL,
    "deposit" INTEGER NOT NULL,
    "status" "RentalLeaseStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "signed_at" TIMESTAMP(3),
    "contract_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_payments" (
    "id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "RentPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immo_contact_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "target_user_id" TEXT,
    "broker_id" TEXT,
    "listing_id" TEXT,
    "listing_kind" TEXT,
    "hub" TEXT,
    "contact_type" "ImmoContactEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "admin_note" TEXT,
    "admin_noted_at" TIMESTAMP(3),
    "admin_noted_by_id" TEXT,

    CONSTRAINT "immo_contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_experts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "photo" TEXT,
    "company" TEXT,
    "license_number" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "max_leads_per_day" INTEGER NOT NULL DEFAULT 10,
    "current_leads_today" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "total_deals" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" INTEGER NOT NULL DEFAULT 0,
    "admin_rating_boost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue_premium_listing" BOOLEAN NOT NULL DEFAULT false,
    "revenue_featured_expert" BOOLEAN NOT NULL DEFAULT false,
    "revenue_premium_placement" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3),
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "dashboard_last_seen_at" TIMESTAMP(3),
    "notifications_last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortgage_experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_subscriptions" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "price" INTEGER NOT NULL DEFAULT 0,
    "max_leads_per_day" INTEGER NOT NULL DEFAULT 5,
    "max_leads_per_month" INTEGER NOT NULL DEFAULT 10,
    "priority_weight" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_billing" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMP(3),
    "leads_assigned_this_month" INTEGER NOT NULL DEFAULT 0,
    "usage_month_utc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_invoices" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "stripe_invoice_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_payout_records" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "mortgage_deal_id" TEXT,
    "expert_amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripe_transfer_id" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_payout_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_credits" (
    "expert_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_credits_pkey" PRIMARY KEY ("expert_id")
);

-- CreateTable
CREATE TABLE "mortgage_expert_reviews" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewer_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_expert_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_brokers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "license_number" TEXT NOT NULL DEFAULT '',
    "years_experience" INTEGER,
    "specialties" TEXT,
    "profile_photo_url" TEXT,
    "id_document_url" TEXT,
    "selfie_photo_url" TEXT,
    "identity_status" TEXT NOT NULL DEFAULT 'pending',
    "insurance_provider" TEXT,
    "insurance_valid" BOOLEAN,
    "broker_references" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "profile_completed_at" TIMESTAMP(3),
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "last_assigned_lead_at" TIMESTAMP(3),
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "leads_viewed_total" INTEGER NOT NULL DEFAULT 0,
    "upgrade_click_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "response_time_avg" DOUBLE PRECISION,
    "response_time_samples" INTEGER NOT NULL DEFAULT 0,
    "total_leads_handled" INTEGER NOT NULL DEFAULT 0,
    "total_lead_unlock_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_lead_unlocks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "property_price" DOUBLE PRECISION NOT NULL,
    "down_payment" DOUBLE PRECISION NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "intent_level" TEXT NOT NULL DEFAULT 'medium',
    "timeline" TEXT NOT NULL DEFAULT '1-3 months',
    "pre_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_purchased_lead" BOOLEAN NOT NULL DEFAULT false,
    "lead_value" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "contact_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlocked_by_broker_id" TEXT,
    "contact_unlocked_at" TIMESTAMP(3),
    "estimated_approval_amount" DOUBLE PRECISION,
    "estimated_monthly_payment" DOUBLE PRECISION,
    "approval_confidence" TEXT,
    "assigned_at" TIMESTAMP(3),
    "performance_stats_recorded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fsbo_listing_id" TEXT,
    "employment_status" TEXT,
    "credit_range" TEXT,

    CONSTRAINT "mortgage_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_lead_unlocks" (
    "id" TEXT NOT NULL,
    "mortgage_request_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'paid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_lead_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_reviews" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "mortgage_request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_lead_distribution_logs" (
    "id" TEXT NOT NULL,
    "mortgage_request_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "routing_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_lead_distribution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_deals" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "deal_amount" INTEGER NOT NULL,
    "platform_share" INTEGER NOT NULL,
    "expert_share" INTEGER NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "status" TEXT NOT NULL DEFAULT 'closed',
    "admin_note" TEXT,
    "review_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortgage_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_in_app_notifications" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'mortgage_lead',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fsbo_listings" (
    "id" TEXT NOT NULL,
    "listing_code" TEXT,
    "owner_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "listing_owner_type" "FsboListingOwnerType" NOT NULL DEFAULT 'SELLER',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "region" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "surface_sqft" INTEGER,
    "images" TEXT[],
    "cover_image" TEXT,
    "photo_tags_json" JSONB,
    "photo_verification_status" "FsboPhotoVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "photo_confirmation_accepted_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "moderation_status" TEXT NOT NULL DEFAULT 'APPROVED',
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "publish_plan" TEXT NOT NULL DEFAULT 'basic',
    "publish_price_cents" INTEGER,
    "paid_publish_at" TIMESTAMP(3),
    "featured_until" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "noise_level" TEXT,
    "family_friendly" BOOLEAN NOT NULL DEFAULT false,
    "kids_allowed" BOOLEAN NOT NULL DEFAULT true,
    "party_allowed" BOOLEAN NOT NULL DEFAULT false,
    "smoking_allowed" BOOLEAN NOT NULL DEFAULT false,
    "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
    "allowed_pet_types" JSONB NOT NULL DEFAULT '[]',
    "max_pet_weight_kg" DOUBLE PRECISION,
    "pet_rules" TEXT,
    "experience_tags" JSONB NOT NULL DEFAULT '[]',
    "services_offered" JSONB NOT NULL DEFAULT '[]',
    "property_type" TEXT,
    "cadastre_number" TEXT,
    "year_built" INTEGER,
    "annual_taxes_cents" INTEGER,
    "condo_fees_cents" INTEGER,
    "seller_declaration_json" JSONB,
    "seller_declaration_ai_review_json" JSONB,
    "risk_score" INTEGER,
    "trust_score" INTEGER,
    "ai_score_reasons_json" JSONB,
    "seller_declaration_completed_at" TIMESTAMP(3),
    "legal_accuracy_accepted_at" TIMESTAMP(3),
    "commission_category" "ListingCommissionCategory" NOT NULL DEFAULT 'SALE',
    "commission_rate" DOUBLE PRECISION,
    "listing_deal_type" TEXT NOT NULL DEFAULT 'SALE',

    CONSTRAINT "fsbo_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_analyses" (
    "id" TEXT NOT NULL,
    "canonical_property_id" BIGINT,
    "property_id" TEXT,
    "short_term_listing_id" TEXT,
    "analysis_type" TEXT NOT NULL,
    "investment_score" INTEGER NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "confidence_score" INTEGER,
    "recommendation" TEXT NOT NULL,
    "opportunity_type" TEXT NOT NULL,
    "summary" JSONB,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_analysis_factors" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "factor_code" TEXT NOT NULL,
    "factor_category" TEXT NOT NULL,
    "factor_value" INTEGER NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL,
    "impact" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_analysis_scenarios" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "scenario_type" TEXT NOT NULL,
    "scenario_mode" TEXT,
    "monthly_rent" INTEGER,
    "occupancy_rate" DECIMAL(5,4),
    "operating_cost" INTEGER,
    "mortgage_cost" INTEGER,
    "monthly_cash_flow" INTEGER,
    "annual_roi" DECIMAL(7,4),
    "cap_rate" DECIMAL(7,4),
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_analysis_comparables" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "comparable_property_id" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "source_type" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "price_per_sqft" DOUBLE PRECISION,
    "property_type" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "area_sqft" INTEGER,
    "listing_status" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_comparables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_offer_strategies" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "suggested_min_offer_cents" INTEGER,
    "suggested_target_offer_cents" INTEGER,
    "suggested_max_offer_cents" INTEGER,
    "confidence_level" TEXT NOT NULL,
    "competition_signal" TEXT,
    "risk_level" TEXT NOT NULL,
    "offer_band" TEXT NOT NULL,
    "offer_posture" TEXT NOT NULL,
    "recommendedConditions" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_offer_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_strategy_scenarios" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "case_id" TEXT,
    "user_id" TEXT NOT NULL,
    "scenario_label" TEXT NOT NULL,
    "input_payload" JSONB NOT NULL,
    "output_payload" JSONB NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "offer_strategy_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_affordability_analyses" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "down_payment_cents" INTEGER,
    "interest_rate" DECIMAL(7,6),
    "amortization_years" INTEGER,
    "monthly_income_cents" INTEGER,
    "monthly_debts_cents" INTEGER,
    "estimated_monthly_payment_cents" INTEGER,
    "affordability_level" TEXT NOT NULL,
    "affordability_ratio" DECIMAL(8,4),
    "confidence_level" TEXT NOT NULL,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_affordability_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_watchlists" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "last_investment_score" INTEGER,
    "last_risk_score" INTEGER,
    "last_opportunity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_portfolio_alerts" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_portfolio_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_pricing_advice" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "price_position" TEXT NOT NULL,
    "confidence_level" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "improvementActions" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_pricing_advice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_analysis_refresh_jobs" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "refresh_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "trigger_source" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_analysis_refresh_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_analysis_refresh_events" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "event_type" TEXT NOT NULL,
    "previous_state" JSONB,
    "new_state" JSONB,
    "confidence_delta" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_refresh_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_negotiation_playbooks" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "offer_strategy_id" TEXT,
    "market_condition" TEXT NOT NULL,
    "posture" TEXT NOT NULL,
    "playbook_steps" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "confidence_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_negotiation_playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_repricing_reviews" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "current_price_cents" INTEGER NOT NULL,
    "current_position" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "confidence_level" TEXT NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_repricing_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_repricing_triggers" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_repricing_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_monitoring_snapshots" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_monitoring_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_monitoring_events" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_monitoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_content_fingerprints" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_content_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_ai_scores" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "trust_score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_ai_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fsbo_listing_documents" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT,
    "file_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fsbo_listing_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "category" "SellerSupportingDocumentCategory" NOT NULL,
    "status" "SellerSupportingDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "declaration_section_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "risk_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "RiskAlertSeverity" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" "VerificationEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" "VerificationCaseStatus" NOT NULL DEFAULT 'pending',
    "overall_score" INTEGER,
    "trust_level" "TrustLevel",
    "readiness_level" "ReadinessLevel",
    "summary" JSONB,
    "score_breakdown" JSONB,
    "explanation" TEXT,
    "created_by" TEXT,
    "assigned_to" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "verification_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_signals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "signal_code" TEXT NOT NULL,
    "signal_name" TEXT NOT NULL,
    "category" "VerificationSignalCategory" NOT NULL,
    "severity" "VerificationSeverity" NOT NULL,
    "status" "VerificationSignalStatus" NOT NULL DEFAULT 'open',
    "score_impact" INTEGER NOT NULL DEFAULT 0,
    "confidence" DECIMAL(5,4),
    "evidence" JSONB,
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verification_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_rule_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "rule_code" TEXT NOT NULL,
    "rule_version" TEXT NOT NULL DEFAULT '1',
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "score_delta" INTEGER NOT NULL DEFAULT 0,
    "confidence" DECIMAL(5,4),
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_rule_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_type" "TrustProfileSubjectType" NOT NULL,
    "subject_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "fraud_score" INTEGER NOT NULL DEFAULT 0,
    "completion_score" INTEGER NOT NULL DEFAULT 0,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "legal_score" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB,
    "last_case_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trust_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "human_review_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "action_type" "HumanReviewActionType" NOT NULL,
    "notes" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "human_review_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "next_best_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "action_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "NextBestActionPriority" NOT NULL DEFAULT 'medium',
    "actor_type" "NextBestActionActorType" NOT NULL,
    "status" "NextBestActionStatus" NOT NULL DEFAULT 'pending',
    "due_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "next_best_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_verification_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" TEXT NOT NULL,
    "case_id" UUID,
    "job_status" "MediaVerificationJobStatus" NOT NULL DEFAULT 'queued',
    "media_type" "MediaVerificationType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "extracted_metadata" JSONB,
    "result" JSONB,
    "predicted_category" TEXT,
    "scene_confidence" DOUBLE PRECISION,
    "classification_engine_version" TEXT,
    "perceptual_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "media_verification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_extraction_jobs" (
    "id" TEXT NOT NULL,
    "source_kind" "TrustgraphExtractionSourceKind" NOT NULL,
    "source_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT,
    "mortgage_file_id" TEXT,
    "status" "TrustgraphExtractionJobStatus" NOT NULL DEFAULT 'queued',
    "model_version" TEXT NOT NULL DEFAULT 'stub-v1',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_extraction_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_extracted_document_records" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "storage_ref" TEXT NOT NULL,
    "document_type" TEXT,
    "extraction_status" TEXT NOT NULL DEFAULT 'pending',
    "extracted_payload" JSONB,
    "normalized_payload" JSONB,
    "confidence" DOUBLE PRECISION,
    "model_version" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_extracted_document_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_extracted_document_fields" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_value" TEXT,
    "confidence" DOUBLE PRECISION,
    "value_source" TEXT NOT NULL DEFAULT 'extraction',

    CONSTRAINT "trustgraph_extracted_document_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_extraction_review_actions" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_extraction_review_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_graph_nodes" (
    "id" TEXT NOT NULL,
    "kind" "TrustgraphFraudGraphNodeKind" NOT NULL,
    "external_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_graph_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_graph_edges" (
    "id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_graph_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_graph_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_geospatial_validations" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "provider_summary" JSONB,
    "precision_score" DOUBLE PRECISION,
    "city_match" BOOLEAN,
    "warnings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_geospatial_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_compliance_workspaces" (
    "id" TEXT NOT NULL,
    "org_type" "TrustgraphComplianceOrgType" NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branding" JSONB,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_compliance_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_compliance_workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TrustgraphWorkspaceMemberRole" NOT NULL,
    "status" "TrustgraphWorkspaceMemberStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_compliance_workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_compliance_workspace_entity_links" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_compliance_workspace_entity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_workspace_case_assignments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "case_id" UUID NOT NULL,
    "assigned_to" TEXT,
    "assigned_by" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "due_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_workspace_case_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_document_approval_flows" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "current_status" TEXT NOT NULL,
    "workspace_id" TEXT,
    "started_by" TEXT NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_document_approval_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_document_approval_steps" (
    "id" TEXT NOT NULL,
    "approval_flow_id" TEXT NOT NULL,
    "step_kind" TEXT NOT NULL,
    "assigned_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_document_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_document_approval_actions" (
    "id" TEXT NOT NULL,
    "approval_flow_id" TEXT NOT NULL,
    "step_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "notes" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_document_approval_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_sla_policies" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "queue_key" TEXT NOT NULL,
    "due_hours" INTEGER NOT NULL,
    "escalates_after_hours" INTEGER,
    "settings" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_sla_events" (
    "id" TEXT NOT NULL,
    "case_id" UUID,
    "approval_flow_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_sla_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_case_sla_states" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "case_id" UUID NOT NULL,
    "sla_policy_id" TEXT,
    "state" TEXT NOT NULL,
    "due_at" TIMESTAMPTZ(6),
    "paused_reason" TEXT,
    "metadata" JSONB,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_case_sla_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "features" JSONB,
    "pricing" JSONB,
    "limits" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_subscriptions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "TrustgraphSubscriptionStatus" NOT NULL DEFAULT 'trial',
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_usage_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "usage_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "trustgraph_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_billing_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_partner_api_keys" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "trustgraph_partner_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_recertification_jobs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "next_run_at" TIMESTAMPTZ(6),
    "last_result" TEXT,
    "config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trustgraph_recertification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_recertification_rules" (
    "id" TEXT NOT NULL,
    "ruleset_key" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "interval_days" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_recertification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_recertification_events" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_recertification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_compliance_rulesets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_pattern" TEXT,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trustgraph_compliance_rulesets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trustgraph_audit_packages" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "package_hash" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trustgraph_audit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_verification_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "linked_entity_type" TEXT NOT NULL,
    "linked_entity_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_verification_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fsbo_listing_verifications" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "identity_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "cadaster_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "address_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "seller_declaration_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "disclosures_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fsbo_listing_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fsbo_leads" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "lead_source" TEXT,
    "tenant_id" TEXT,
    "deal_origin_tag" TEXT,
    "commission_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fsbo_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "buyer_email" TEXT,
    "buyer_name" TEXT,
    "buyer_phone" TEXT,
    "fsbo_listing_id" TEXT NOT NULL,
    "budget_min_cents" INTEGER,
    "budget_max_cents" INTEGER,
    "timeline" TEXT,
    "preferences" TEXT,
    "lead_source" TEXT NOT NULL DEFAULT 'PLATFORM_BROKER',
    "assigned_broker_id" TEXT,
    "broker_client_id" TEXT,
    "conversation_id" TEXT,
    "commission_eligible" BOOLEAN NOT NULL DEFAULT true,
    "deal_origin_tag" TEXT NOT NULL DEFAULT 'PLATFORM_MANAGED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisory_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "plan" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "buyer_tier" TEXT NOT NULL DEFAULT 'PREMIUM',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisory_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_listing_views" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_listing_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_saved_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_saved_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" DOUBLE PRECISION NOT NULL,
    "sqft" INTEGER NOT NULL,
    "propertyType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_media" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "media_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_hosts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "property_type" TEXT,
    "location" TEXT,
    "description" TEXT,
    "ownership_confirmation_status" TEXT NOT NULL DEFAULT 'pending',
    "ownership_confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_ads_daily_rollups" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "spend_cents" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL DEFAULT 'mixed',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_ads_daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_host_pipeline_entries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_contacted',
    "contacted_at" TIMESTAMP(3),
    "response_status" TEXT,
    "listing_created" BOOLEAN NOT NULL DEFAULT false,
    "short_term_listing_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_host_pipeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_investor_contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_contacted',
    "notes" TEXT,
    "last_contact_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_investor_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_promotion_plans" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "billing_period" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_promotion_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_promotion_orders" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "payer_user_id" TEXT NOT NULL,
    "short_term_listing_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "platform_payment_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_promotion_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_sales_assist_entries" (
    "id" TEXT NOT NULL,
    "guest_user_id" TEXT,
    "guest_email" TEXT,
    "assigned_to_user_id" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "converted_booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_sales_assist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_automation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "trigger" TEXT NOT NULL,
    "booking_id" TEXT,
    "dedupe_key" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_host_agreements" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3),
    "version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_host_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_host_listings" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "max_guests" INTEGER NOT NULL DEFAULT 4,
    "images" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_host_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_hub_hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_hub_hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_hub_rooms" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "hotel_hub_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_hub_bookings" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3) NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_hub_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_packages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travel_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_package_bookings" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "guest_name" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "number_of_people" INTEGER NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travel_package_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_bookings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "total_spots" INTEGER NOT NULL,
    "booked_spots" INTEGER NOT NULL DEFAULT 0,
    "price_per_spot" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "shared_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_listings" (
    "id" TEXT NOT NULL,
    "listing_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "propertyType" TEXT,
    "roomType" TEXT,
    "category" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "nightPriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxGuests" INTEGER NOT NULL DEFAULT 4,
    "bedrooms" INTEGER,
    "beds" INTEGER NOT NULL,
    "baths" DOUBLE PRECISION NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "houseRules" TEXT,
    "checkInInstructions" TEXT,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "cancellationPolicy" TEXT,
    "cleaningFeeCents" INTEGER NOT NULL DEFAULT 0,
    "securityDepositCents" INTEGER NOT NULL DEFAULT 0,
    "instantBookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minStayNights" INTEGER,
    "maxStayNights" INTEGER,
    "listingStatus" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "listingAuthorityType" "ListingAuthorityType",
    "listingVerificationStatus" "ListingVerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "cadastreNumber" TEXT,
    "municipality" TEXT,
    "province" TEXT,
    "verificationDocUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "submittedForVerificationAt" TIMESTAMP(3),
    "brokerLicenseNumber" TEXT,
    "brokerageName" TEXT,
    "safetyFeatures" JSONB NOT NULL DEFAULT '[]',
    "accessibilityFeatures" JSONB NOT NULL DEFAULT '[]',
    "parkingDetails" TEXT,
    "neighborhoodDetails" TEXT,
    "noise_level" TEXT,
    "family_friendly" BOOLEAN NOT NULL DEFAULT false,
    "kids_allowed" BOOLEAN NOT NULL DEFAULT true,
    "party_allowed" BOOLEAN NOT NULL DEFAULT false,
    "smoking_allowed" BOOLEAN NOT NULL DEFAULT false,
    "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
    "allowed_pet_types" JSONB NOT NULL DEFAULT '[]',
    "max_pet_weight_kg" DOUBLE PRECISION,
    "pet_rules" TEXT,
    "experience_tags" JSONB NOT NULL DEFAULT '[]',
    "services_offered" JSONB NOT NULL DEFAULT '[]',
    "condition_of_property" TEXT,
    "known_issues" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "host_id" TEXT NOT NULL,
    "property_identity_id" TEXT,
    "external_sync_enabled" BOOLEAN NOT NULL DEFAULT false,
    "channel_ical_export_token" TEXT,

    CONSTRAINT "bnhub_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_property_classification" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "star_rating" INTEGER NOT NULL,
    "amenities_score" INTEGER NOT NULL,
    "comfort_score" INTEGER NOT NULL,
    "services_score" INTEGER NOT NULL,
    "safety_score" INTEGER NOT NULL,
    "completeness_score" INTEGER NOT NULL,
    "luxury_score" INTEGER NOT NULL,
    "ai_adjustment_score" INTEGER NOT NULL DEFAULT 0,
    "rating_label" TEXT,
    "breakdown_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_property_classification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_engine_audit_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "host_user_id" TEXT,
    "decision_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_engine_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_luxury_tiers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "tier_code" "BnhubLuxuryTierCode" NOT NULL DEFAULT 'NONE',
    "tier_score" INTEGER NOT NULL DEFAULT 0,
    "eligibility_status" "BnhubLuxuryEligibilityStatus" NOT NULL DEFAULT 'INELIGIBLE',
    "trust_component_score" INTEGER NOT NULL DEFAULT 0,
    "quality_component_score" INTEGER NOT NULL DEFAULT 0,
    "responsiveness_component_score" INTEGER NOT NULL DEFAULT 0,
    "hospitality_component_score" INTEGER NOT NULL DEFAULT 0,
    "visual_component_score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "breakdown_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_luxury_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_trust_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "verification_score" INTEGER NOT NULL DEFAULT 0,
    "documentation_score" INTEGER NOT NULL DEFAULT 0,
    "listing_consistency_score" INTEGER NOT NULL DEFAULT 0,
    "photo_authenticity_score" INTEGER NOT NULL DEFAULT 0,
    "pricing_sanity_score" INTEGER NOT NULL DEFAULT 0,
    "duplication_risk_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_risk_score" INTEGER NOT NULL DEFAULT 0,
    "overall_risk_level" "BnhubTrustRiskLevel" NOT NULL DEFAULT 'LOW',
    "status" "BnhubTrustProfileStatus" NOT NULL DEFAULT 'TRUSTED',
    "flags_json" JSONB,
    "recommendations_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_trust_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_fraud_flags" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "host_user_id" TEXT,
    "flag_type" "BnhubFraudFlagType" NOT NULL,
    "severity" "BnhubFraudSeverity" NOT NULL DEFAULT 'LOW',
    "status" "BnhubFraudFlagStatus" NOT NULL DEFAULT 'OPEN',
    "auto_generated" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_identity_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_role" "BnhubTrustIdentityUserRole" NOT NULL,
    "provider" "BnhubTrustIdentityProvider" NOT NULL,
    "verification_session_id" TEXT,
    "verification_status" "BnhubTrustIdentitySessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "document_type" TEXT,
    "country_code" TEXT,
    "result_summary" TEXT,
    "provider_payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_address_verifications" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "raw_address" TEXT NOT NULL,
    "normalized_address" TEXT,
    "geocode_provider" "BnhubTrustGeocodeProvider" NOT NULL,
    "geocode_status" "BnhubTrustGeocodeStatus" NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "place_metadata_json" JSONB NOT NULL DEFAULT '{}',
    "mismatch_flags_json" JSONB NOT NULL DEFAULT '{}',
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_address_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_media_validations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "cover_photo_score" INTEGER NOT NULL DEFAULT 0,
    "photo_coverage_score" INTEGER NOT NULL DEFAULT 0,
    "exterior_photo_present" BOOLEAN NOT NULL DEFAULT false,
    "duplicate_image_risk_score" INTEGER NOT NULL DEFAULT 0,
    "image_consistency_score" INTEGER NOT NULL DEFAULT 0,
    "streetview_comparison_status" "BnhubTrustStreetviewCompareStatus" NOT NULL DEFAULT 'NOT_RUN',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_media_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_listing_risk_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "identity_score" INTEGER NOT NULL DEFAULT 0,
    "address_score" INTEGER NOT NULL DEFAULT 0,
    "media_score" INTEGER NOT NULL DEFAULT 0,
    "price_sanity_score" INTEGER NOT NULL DEFAULT 0,
    "duplication_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_score" INTEGER NOT NULL DEFAULT 0,
    "safety_policy_score" INTEGER NOT NULL DEFAULT 0,
    "overall_risk_score" INTEGER NOT NULL DEFAULT 0,
    "overall_risk_level" "BnhubTrustRiskLevel" NOT NULL DEFAULT 'LOW',
    "trust_status" "BnhubTrustProfileStatus" NOT NULL DEFAULT 'TRUSTED',
    "payout_restriction_status" "BnhubTrustPayoutGateStatus" NOT NULL DEFAULT 'NONE',
    "promotion_eligibility_status" "BnhubTrustPromotionGateStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "notes" TEXT,
    "breakdown_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_listing_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_risk_flags" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "user_id" TEXT,
    "reservation_id" TEXT,
    "flag_type" "BnhubTrustRiskFlagTypeV2" NOT NULL,
    "severity" "BnhubFraudSeverity" NOT NULL,
    "visibility_scope" "BnhubTrustRiskFlagVisibility" NOT NULL DEFAULT 'ADMIN_ONLY',
    "flag_status" "BnhubFraudFlagStatus" NOT NULL DEFAULT 'OPEN',
    "auto_generated" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT NOT NULL,
    "evidence_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_location_policy_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "policy_status" "BnhubTrustLocationPolicyStatus" NOT NULL DEFAULT 'PENDING',
    "zone_policy_result" "BnhubTrustZonePolicyResult" NOT NULL DEFAULT 'UNKNOWN',
    "access_safety_result" "BnhubTrustAccessSafetyResult" NOT NULL DEFAULT 'CLEAR',
    "evidence_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_location_policy_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_identity_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "BnhubTrustIdentityAuditActor" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_identity_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_dynamic_pricing_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "recommended_price" DECIMAL(12,2) NOT NULL,
    "min_price" DECIMAL(12,2) NOT NULL,
    "max_price" DECIMAL(12,2) NOT NULL,
    "weekday_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "weekend_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "seasonal_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "demand_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "quality_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "luxury_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "trust_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "market_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "explanation_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_dynamic_pricing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_pricing_rules" (
    "id" TEXT NOT NULL,
    "scope_type" "BnhubPricingScopeType" NOT NULL,
    "scope_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rule_name" TEXT NOT NULL,
    "rule_type" "BnhubPricingRuleType" NOT NULL,
    "conditions_json" JSONB,
    "actions_json" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_pricing_history" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "previous_price" DECIMAL(12,2) NOT NULL,
    "recommended_price" DECIMAL(12,2) NOT NULL,
    "applied_price" DECIMAL(12,2),
    "reason_summary" TEXT NOT NULL,
    "factors_json" JSONB,
    "source_type" "BnhubPricingHistorySource" NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_pricing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_host_quality_profiles" (
    "id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "responsiveness_score" INTEGER NOT NULL DEFAULT 50,
    "cancellation_rate_bps" INTEGER NOT NULL DEFAULT 0,
    "message_rate_score" INTEGER NOT NULL DEFAULT 50,
    "breakdown_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_host_quality_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_disclosures" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "structural_issues" TEXT,
    "water_damage" TEXT,
    "renovations" TEXT,
    "defects" TEXT,
    "form_data" JSONB,
    "completed_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_disclosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_draft_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_draft_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_template_answers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_template_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_compliance_reviews" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_compliance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "license_number" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "document_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "document_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "document_url" TEXT,
    "project_details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "developer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_disclosures" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "structural_issues" BOOLEAN NOT NULL DEFAULT false,
    "water_damage" BOOLEAN NOT NULL DEFAULT false,
    "renovations" TEXT,
    "known_defects" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_disclosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BnhubListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BnhubListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingVerificationLog" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_documents" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "document_type" "PropertyDocumentType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "cadastre_number" TEXT,
    "owner_name" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_extractions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "cadastre_number" TEXT,
    "owner_name" TEXT,
    "property_address" TEXT,
    "municipality" TEXT,
    "lot_number" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_text_snippet" TEXT,

    CONSTRAINT "document_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_matches" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "document_extraction_id" TEXT NOT NULL,
    "cadastre_match" "MatchStatus" NOT NULL,
    "address_match" "MatchStatus" NOT NULL,
    "owner_match" "MatchStatus" NOT NULL,
    "overall_status" "MatchStatus" NOT NULL,
    "verification_score" INTEGER NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_fraud_alerts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_fraud_scores" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "fraud_score" INTEGER NOT NULL,
    "risk_level" TEXT NOT NULL,
    "reasons" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_fraud_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_fraud_alerts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_checks" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_scores" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_booking_agreements" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "document_url" TEXT,
    "content_markdown" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_booking_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_host_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_host_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_guest_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "history" JSONB DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_guest_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_activity_scores" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "listing_count" INTEGER NOT NULL DEFAULT 0,
    "fraud_flags" INTEGER NOT NULL DEFAULT 0,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_activity_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_identities" (
    "id" TEXT NOT NULL,
    "property_uid" TEXT NOT NULL,
    "cadastre_number" TEXT,
    "official_address" TEXT NOT NULL,
    "normalized_address" TEXT NOT NULL,
    "municipality" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "property_type" TEXT,
    "verification_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "market_region_id" TEXT,

    CONSTRAINT "property_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_transactions" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "offer_price" INTEGER,
    "status" TEXT NOT NULL,
    "frozen_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_offers" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "offer_price" INTEGER NOT NULL,
    "conditions" JSONB,
    "expiration_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_counter_offers" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "counter_price" INTEGER NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_counter_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_messages" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_deposits" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_provider" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_documents" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "signed_by_buyer" BOOLEAN NOT NULL DEFAULT false,
    "signed_by_seller" BOOLEAN NOT NULL DEFAULT false,
    "signed_by_broker" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_steps" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_events" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_timelines" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "current_stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "next_required_action" TEXT,
    "cancelled_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_timeline_steps" (
    "id" TEXT NOT NULL,
    "timeline_id" TEXT NOT NULL,
    "step_code" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_to_role" TEXT,
    "assigned_to_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by_user_id" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_timeline_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_timeline_events" (
    "id" TEXT NOT NULL,
    "timeline_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_identity_links" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "listing_type" TEXT NOT NULL,
    "linked_by_user_id" TEXT NOT NULL,
    "link_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_identity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_identity_verifications" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "verification_type" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_identity_owners" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "owner_source" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_identity_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_identity_risk" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" TEXT NOT NULL,
    "risk_reasons" JSONB,
    "last_evaluated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_identity_risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_identity_events" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_identity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_identities" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "primary_source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_identities" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "brokerage_name" TEXT NOT NULL,
    "regulator_ref" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_identities" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "organization_type" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_authorities" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "authority_type" TEXT NOT NULL,
    "owner_identity_id" TEXT,
    "broker_identity_id" TEXT,
    "organization_identity_id" TEXT,
    "document_reference" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_links" (
    "id" TEXT NOT NULL,
    "identity_type" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "link_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_history" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "owner_identity_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "effective_start_date" TIMESTAMP(3) NOT NULL,
    "effective_end_date" TIMESTAMP(3),
    "verification_status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ownership_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_authorization_history" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "broker_identity_id" TEXT NOT NULL,
    "owner_identity_id" TEXT,
    "authorization_source" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "verification_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_authorization_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_risk_profiles" (
    "id" TEXT NOT NULL,
    "identity_type" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" TEXT NOT NULL,
    "risk_reasons" JSONB,
    "investigation_status" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_events" (
    "id" TEXT NOT NULL,
    "identity_type" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_valuations" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "valuation_type" TEXT NOT NULL,
    "estimated_value" INTEGER,
    "value_min" INTEGER,
    "value_max" INTEGER,
    "monthly_rent_estimate" INTEGER,
    "nightly_rate_estimate" INTEGER,
    "annual_revenue_estimate" INTEGER,
    "gross_yield_estimate" DOUBLE PRECISION,
    "investment_score" INTEGER,
    "confidence_score" INTEGER NOT NULL,
    "confidence_label" TEXT NOT NULL,
    "valuation_summary" TEXT,
    "explanation" JSONB,
    "comparables_summary" JSONB,
    "risk_level" TEXT,
    "seasonality_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "city" TEXT,
    "municipality" TEXT,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_graph_edges" (
    "id" TEXT NOT NULL,
    "from_entity_type" TEXT NOT NULL,
    "from_entity_id" TEXT NOT NULL,
    "to_entity_type" TEXT NOT NULL,
    "to_entity_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_type" TEXT NOT NULL,
    "parent_region_id" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "province" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_price_index" (
    "id" TEXT NOT NULL,
    "market_region_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "average_price" INTEGER,
    "median_price" INTEGER,
    "price_per_unit" INTEGER,
    "trend_direction" TEXT,
    "sample_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_price_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_rent_index" (
    "id" TEXT NOT NULL,
    "market_region_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "average_rent" INTEGER,
    "median_rent" INTEGER,
    "rent_per_unit" INTEGER,
    "trend_direction" TEXT,
    "sample_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_rent_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_bnhub_index" (
    "id" TEXT NOT NULL,
    "market_region_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "average_nightly_rate" INTEGER,
    "average_occupancy" DOUBLE PRECISION,
    "average_monthly_revenue" INTEGER,
    "average_rating" DOUBLE PRECISION,
    "sample_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_bnhub_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_demand_metrics" (
    "id" TEXT NOT NULL,
    "market_region_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "demand_score" DOUBLE PRECISION,
    "search_volume" INTEGER,
    "booking_volume" INTEGER,
    "inventory_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_demand_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_investment_scores" (
    "id" TEXT NOT NULL,
    "property_identity_id" TEXT NOT NULL,
    "market_region_id" TEXT NOT NULL,
    "investment_score" INTEGER NOT NULL,
    "risk_level" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_investment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_reports" (
    "id" TEXT NOT NULL,
    "market_region_id" TEXT NOT NULL,
    "report_period" TEXT NOT NULL,
    "report_summary" TEXT,
    "report_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data_points" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT,
    "property_type" TEXT NOT NULL,
    "avg_price_cents" INTEGER NOT NULL,
    "median_price_cents" INTEGER,
    "avg_rent_cents" INTEGER,
    "transactions" INTEGER,
    "inventory" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_data_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "related_entity_type" TEXT NOT NULL,
    "related_entity_id" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "file_path" TEXT,
    "format" TEXT NOT NULL DEFAULT 'html',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "change_summary" TEXT,
    "signature_fields" JSONB,
    "content_html" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notaries" (
    "id" TEXT NOT NULL,
    "notary_name" TEXT NOT NULL,
    "notary_email" TEXT NOT NULL,
    "notary_office" TEXT,
    "jurisdiction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closing_packages" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "package_status" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "notary_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "closing_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closing_package_documents" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closing_package_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_verifications" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "cadastre_number" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "request_more_documents_reason" TEXT,
    "request_more_documents_by" TEXT,
    "request_more_documents_at" TIMESTAMP(3),

    CONSTRAINT "property_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "government_id_file" TEXT,
    "selfie_photo" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "brokerage_company" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_tax_registrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "business_name" TEXT,
    "business_number_nine" TEXT NOT NULL,
    "gst_number" TEXT,
    "qst_number" TEXT,
    "business_address" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "status" "BrokerTaxRegistrationStatus" NOT NULL DEFAULT 'PENDING_STAFF_REVIEW',
    "admin_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_tax_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_location_validation" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "validation_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_location_validation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "day_status" "BnhubDayAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "booked_by_booking_id" TEXT,
    "priceOverrideCents" INTEGER,
    "minStayNights" INTEGER,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_mapping" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "platform" "BnhubChannelPlatform" NOT NULL,
    "external_id" TEXT NOT NULL,
    "sync_status" "BnhubChannelSyncStatus" NOT NULL DEFAULT 'IDLE',
    "last_error" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_channel_sync_logs" (
    "id" TEXT NOT NULL,
    "mapping_id" TEXT,
    "listing_id" TEXT,
    "platform" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_channel_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_channel_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "BnhubChannelPlatform" NOT NULL,
    "connection_type" "BnhubChannelConnectionType" NOT NULL,
    "external_listing_id" TEXT,
    "ical_import_url" TEXT,
    "ical_export_url" TEXT,
    "status" "BnhubChannelConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_sync_at" TIMESTAMP(3),
    "sync_frequency_minutes" INTEGER NOT NULL DEFAULT 30,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_channel_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_channel_mappings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "channel_connection_id" TEXT NOT NULL,
    "external_listing_ref" TEXT NOT NULL,
    "mapping_status" "BnhubChannelListingMapStatus" NOT NULL DEFAULT 'LINKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_channel_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_channel_events" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "channel_connection_id" TEXT,
    "source" "BnhubChannelEventSource" NOT NULL,
    "platform" "BnhubChannelPlatform" NOT NULL,
    "external_event_id" TEXT,
    "event_type" "BnhubChannelEventKind" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "guest_name" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_channel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_sync_logs" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "sync_type" "BnhubOtaSyncType" NOT NULL,
    "status" "BnhubOtaSyncResultStatus" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payment_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_type" "BnhubMpAccountRole" NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "processor_account_id" TEXT NOT NULL,
    "onboarding_status" "BnhubMpOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "charges_enabled" BOOLEAN NOT NULL DEFAULT false,
    "requirements_json" JSONB NOT NULL DEFAULT '{}',
    "verification_status" "BnhubMpVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payment_quotes" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "listing_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "nightly_subtotal_cents" INTEGER NOT NULL,
    "cleaning_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_total_cents" INTEGER NOT NULL DEFAULT 0,
    "service_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "add_on_total_cents" INTEGER NOT NULL DEFAULT 0,
    "bundle_total_cents" INTEGER NOT NULL DEFAULT 0,
    "membership_discount_cents" INTEGER NOT NULL DEFAULT 0,
    "coupon_discount_cents" INTEGER NOT NULL DEFAULT 0,
    "security_hold_cents" INTEGER NOT NULL DEFAULT 0,
    "grand_total_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricing_snapshot_json" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_payment_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_quote_id" TEXT,
    "legacy_payment_id" TEXT,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "processor_payment_intent_id" TEXT,
    "processor_checkout_session_id" TEXT,
    "amount_authorized_cents" INTEGER NOT NULL DEFAULT 0,
    "amount_captured_cents" INTEGER NOT NULL DEFAULT 0,
    "amount_refunded_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_status" "BnhubMpReservationPaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "capture_mode" "BnhubMpCaptureMode" NOT NULL DEFAULT 'AUTOMATIC',
    "payment_method_type" TEXT,
    "funds_flow_type" "BnhubMpFundsFlow" NOT NULL DEFAULT 'DESTINATION_CHARGE',
    "risk_hold_status" "BnhubMpRiskHold" NOT NULL DEFAULT 'NONE',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "paid_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payouts" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "processor_transfer_id" TEXT,
    "processor_payout_id" TEXT,
    "gross_amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "reserve_amount_cents" INTEGER NOT NULL DEFAULT 0,
    "net_amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payout_status" "BnhubMpPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "release_reason" TEXT,
    "eligible_release_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payment_holds" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "hold_type" "BnhubMpHoldType" NOT NULL,
    "hold_status" "BnhubMpHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_payment_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_refunds" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "refund_type" "BnhubMpRefundType" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "refund_status" "BnhubMpRefundStatus" NOT NULL DEFAULT 'DRAFT',
    "processor_refund_id" TEXT,
    "reason_code" TEXT NOT NULL,
    "summary" TEXT,
    "initiated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_disputes" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "processor_dispute_id" TEXT,
    "dispute_status" "BnhubMpDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason_code" TEXT,
    "evidence_due_by" TIMESTAMP(3),
    "summary" TEXT,
    "evidence_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payment_events" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT,
    "payout_id" TEXT,
    "refund_id" TEXT,
    "dispute_id" TEXT,
    "booking_id" TEXT,
    "actor_type" "BnhubMpPaymentEventActor" NOT NULL,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_financial_ledgers" (
    "id" TEXT NOT NULL,
    "entity_type" "BnhubMpLedgerEntity" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "user_id" TEXT,
    "direction" "BnhubMpLedgerDirection" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "entry_type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_financial_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_payment_processor_webhooks" (
    "id" TEXT NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "processing_status" "BnhubMpWebhookInboxStatus" NOT NULL DEFAULT 'RECEIVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_payment_processor_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "booking_code" TEXT,
    "confirmation_code" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "guestFeeCents" INTEGER NOT NULL DEFAULT 0,
    "hostFeeCents" INTEGER NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "guestNotes" TEXT,
    "special_request" TEXT,
    "special_requests_json" JSONB,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "refunded_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guestId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "booking_source" "BnhubBookingSource" NOT NULL DEFAULT 'LOCAL',
    "guest_confirmation_email_sent_at" TIMESTAMP(3),
    "guest_invoice_email_sent_at" TIMESTAMP(3),
    "host_booking_alert_email_sent_at" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bn_guarantees" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "guarantee_type" TEXT NOT NULL,
    "status" "BnhubGuaranteeStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bn_guarantees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_booking_issues" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "issue_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_booking_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BnhubBookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BnhubBookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BnhubCheckinDetails" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "instructions" TEXT,
    "keyInfo" TEXT,
    "accessType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BnhubCheckinDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_booking_invoices" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "payment_intent_id" TEXT,
    "guest_name_snapshot" TEXT,
    "listing_title_snapshot" TEXT,
    "confirmation_code" TEXT,
    "total_amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER,
    "host_payout_cents" INTEGER,
    "stripe_connect_account_id" TEXT,
    "payment_status" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linked_contract_id" TEXT,
    "linked_contract_type" TEXT,

    CONSTRAINT "bnhub_booking_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMessage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "listing_code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "claimant" "DisputeClaimant" NOT NULL,
    "claimantUserId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "complaintCategory" TEXT,
    "evidenceUrls" JSONB NOT NULL DEFAULT '[]',
    "status" "DisputeStatus" NOT NULL DEFAULT 'SUBMITTED',
    "urgency_level" TEXT,
    "resolution_outcome" TEXT,
    "refund_cents" INTEGER,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "host_payout_frozen_at" TIMESTAMP(3),
    "host_responded_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_resolutions" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "resolution_type" TEXT NOT NULL,
    "refund_cents" INTEGER,
    "notes" TEXT,
    "resolvedBy" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_account_warnings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "warning_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "penalty_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "host_account_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostQuality" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "isSuperHost" BOOLEAN NOT NULL DEFAULT false,
    "cancellationRate" DOUBLE PRECISION,
    "avgResponseMinutes" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostQuality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rewardCreditsReferrer" INTEGER NOT NULL DEFAULT 500,
    "rewardCreditsReferee" INTEGER NOT NULL DEFAULT 500,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "programId" TEXT,
    "referrerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referral_public_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'joined',
    "reward_given" BOOLEAN NOT NULL DEFAULT false,
    "invite_kind" VARCHAR(24),
    "rewardCreditsCents" INTEGER NOT NULL DEFAULT 0,
    "usedByUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambassador" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralEvent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorPayout" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRecommendation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "recommendedCents" INTEGER NOT NULL,
    "marketAvgCents" INTEGER NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "minStayNights" INTEGER,
    "factors" JSONB NOT NULL DEFAULT '[]',
    "forDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchRankingConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchRankingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "signalType" "FraudSignalType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "signalIds" JSONB NOT NULL DEFAULT '[]',
    "riskScore" DOUBLE PRECISION NOT NULL,
    "status" "FraudAlertStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_investigations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "fraud_reason" TEXT NOT NULL,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'OPEN',
    "opened_by" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_enforcement_actions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" "ListingFraudEnforcementType" NOT NULL,
    "reason_code" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_enforcement_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_holds" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PayoutHoldStatus" NOT NULL DEFAULT 'ON_HOLD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "payout_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_risk_history" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "risk_type" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_risk_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeMessage" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "type" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostQualityHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "isSuperHost" BOOLEAN NOT NULL,
    "cancellationRate" DOUBLE PRECISION,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostQualityHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyGrowthMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "newListings" INTEGER NOT NULL,
    "newHosts" INTEGER NOT NULL DEFAULT 0,
    "referralSignups" INTEGER NOT NULL DEFAULT 0,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "totalHosts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyGrowthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "guestFeeCents" INTEGER NOT NULL,
    "hostFeeCents" INTEGER NOT NULL,
    "hostPayoutCents" INTEGER,
    "platform_fee_cents" INTEGER,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "stripe_checkout_session_id" TEXT,
    "stripe_receipt_url" TEXT,
    "stripe_checkout_amount_cents" INTEGER,
    "stripe_checkout_currency" TEXT,
    "stripe_connect_account_id" TEXT,
    "host_payout_released_at" TIMESTAMP(3),
    "scheduled_host_payout_at" TIMESTAMP(3),
    "payout_hold_reason" TEXT,
    "linked_contract_id" TEXT,
    "linked_contract_type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "project_id" TEXT,
    "booking_id" TEXT,
    "deal_id" TEXT,
    "fsbo_listing_id" TEXT,
    "payment_type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "platform_fee_cents" INTEGER,
    "host_payout_cents" INTEGER,
    "stripe_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_fee_cents" INTEGER,
    "refunded_amount_cents" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "broker_tax_snapshot" JSONB,
    "tax_calculation_json" JSONB,
    "tax_override_json" JSONB,
    "linked_contract_id" TEXT,
    "linked_contract_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "broker_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platform_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_commissions" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "gross_amount_cents" INTEGER NOT NULL,
    "broker_amount_cents" INTEGER NOT NULL DEFAULT 0,
    "platform_amount_cents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_payouts" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "status" "BrokerPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payout_method" TEXT NOT NULL DEFAULT 'manual',
    "total_amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "recorded_paid_by_user_id" TEXT,
    "failure_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_payout_lines" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "commission_id" TEXT NOT NULL,

    CONSTRAINT "broker_payout_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "deal_code" TEXT,
    "listing_id" TEXT,
    "listing_code" TEXT,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "price_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "crm_stage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lead_id" TEXT,
    "workspace_id" UUID,
    "lead_contact_origin" "LeadContactOrigin",
    "commission_source" "LeadContactOrigin",
    "commission_eligible" BOOLEAN NOT NULL DEFAULT false,
    "possible_bypass_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_milestones" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_documents" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_invoices" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_issuer" "InvoiceIssuer" NOT NULL DEFAULT 'PLATFORM',
    "user_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "PlatformInvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "hub_source" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "pdf_url" TEXT,
    "invoice_label" TEXT,
    "invoice_tax_details" JSONB,
    "subtotal_cents" INTEGER,
    "gst_cents" INTEGER,
    "qst_cents" INTEGER,
    "total_cents" INTEGER,
    "invoice_lines" JSONB,
    "tax_mode" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "linked_contract_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_financial_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "legal_name" TEXT,
    "platform_gst_number" TEXT,
    "platform_qst_number" TEXT,
    "default_gst_rate" DECIMAL(12,8) NOT NULL DEFAULT 0.05,
    "default_qst_rate" DECIMAL(12,8) NOT NULL DEFAULT 0.09975,
    "apply_tax_platform_services" BOOLEAN NOT NULL DEFAULT true,
    "apply_tax_broker_commissions" BOOLEAN NOT NULL DEFAULT true,
    "payment_type_tax_overrides" JSONB,
    "investment_features_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_financial_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_revenue_ledger_entries" (
    "id" TEXT NOT NULL,
    "platform_payment_id" TEXT NOT NULL,
    "party" "RevenueParty" NOT NULL,
    "category" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "broker_commission_id" TEXT,
    "broker_id" TEXT,
    "deal_id" TEXT,
    "listing_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_revenue_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_ledger_entries" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "stripe_object_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "fee_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "status" TEXT NOT NULL,
    "user_id" TEXT,
    "platform_payment_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_documents" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "period_year" INTEGER,
    "period_month" INTEGER,
    "subject_user_id" TEXT,
    "dealId" TEXT,
    "platform_payment_id" TEXT,
    "summary_markdown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "issue_date" TIMESTAMP(3),
    "generated_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "propertyRating" INTEGER NOT NULL,
    "hostRating" INTEGER,
    "cleanlinessRating" INTEGER,
    "accuracy_rating" INTEGER,
    "communicationRating" INTEGER,
    "locationRating" INTEGER,
    "valueRating" INTEGER,
    "check_in_rating" INTEGER,
    "comment" TEXT,
    "moderation_held" BOOLEAN NOT NULL DEFAULT false,
    "spam_score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guestId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_rating_aggregates" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "avg_rating" DOUBLE PRECISION NOT NULL,
    "total_reviews" INTEGER NOT NULL,
    "cleanliness_avg" DOUBLE PRECISION NOT NULL,
    "accuracy_avg" DOUBLE PRECISION NOT NULL,
    "communication_avg" DOUBLE PRECISION NOT NULL,
    "location_avg" DOUBLE PRECISION NOT NULL,
    "value_avg" DOUBLE PRECISION NOT NULL,
    "checkin_avg" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_rating_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_performance" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "response_rate" DOUBLE PRECISION NOT NULL,
    "avg_response_time" DOUBLE PRECISION NOT NULL,
    "cancellation_rate" DOUBLE PRECISION NOT NULL,
    "completion_rate" DOUBLE PRECISION NOT NULL,
    "dispute_rate" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_badges" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "badge_type" VARCHAR(48) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_ranking_scores" (
    "id" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "listing_id" VARCHAR(40) NOT NULL,
    "city" VARCHAR(128),
    "neighborhood" VARCHAR(128),
    "total_score" DOUBLE PRECISION NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "trust_score" DOUBLE PRECISION NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "engagement_score" DOUBLE PRECISION NOT NULL,
    "conversion_score" DOUBLE PRECISION NOT NULL,
    "freshness_score" DOUBLE PRECISION NOT NULL,
    "host_score" DOUBLE PRECISION,
    "review_score" DOUBLE PRECISION,
    "price_competitiveness_score" DOUBLE PRECISION,
    "availability_score" DOUBLE PRECISION,
    "metadata_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_ranking_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_configs" (
    "id" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "weights_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_impression_logs" (
    "id" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "listing_id" VARCHAR(40) NOT NULL,
    "page_type" VARCHAR(32),
    "position" INTEGER,
    "city" VARCHAR(128),
    "user_id" TEXT,
    "session_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_impression_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_click_logs" (
    "id" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "listing_id" VARCHAR(40) NOT NULL,
    "page_type" VARCHAR(32),
    "position" INTEGER,
    "user_id" TEXT,
    "session_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_click_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_risk_scores" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" VARCHAR(16) NOT NULL,
    "score_version" VARCHAR(32) NOT NULL,
    "evidence_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "flag_type" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'open',
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_review_queue" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reason_summary" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "assigned_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_action_logs" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "action_type" VARCHAR(64) NOT NULL,
    "result_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_operation_profiles" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "city_name" VARCHAR(128) NOT NULL,
    "province_or_state" VARCHAR(64),
    "country_code" VARCHAR(8),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "launch_stage" VARCHAR(24) NOT NULL DEFAULT 'planned',
    "city_type" VARCHAR(32),
    "listing_type_support_json" JSONB,
    "growth_config_json" JSONB,
    "ranking_config_key" VARCHAR(128),
    "messaging_config_json" JSONB,
    "fraud_config_json" JSONB,
    "trust_config_json" JSONB,
    "launch_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_operation_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "snapshot_type" VARCHAR(16) NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_recommendations" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "recommendation_type" VARCHAR(64) NOT NULL,
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(24) NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details_json" JSONB NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_rollout_events" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_rollout_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "scopeValue" TEXT,
    "reason" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalControl" (
    "id" TEXT NOT NULL,
    "controlType" "OperationalControlType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "payload" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "reasonCode" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "OperationalControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlActionAuditLog" (
    "id" TEXT NOT NULL,
    "controlId" TEXT,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "reasonCode" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlActionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHealthMetric" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceHealthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "SystemAlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source_module" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "payload" JSONB,
    "region" TEXT,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_property_recommendations" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "confidence_score" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_property_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_property_alerts" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_property_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_property_scores" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score_type" TEXT NOT NULL,
    "score_value" INTEGER NOT NULL,
    "score_label" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_property_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_property_manager_decisions" (
    "id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "input_summary" TEXT,
    "output_summary" TEXT,
    "confidence_score" INTEGER,
    "recommended_action" TEXT,
    "automated_action" TEXT,
    "human_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_property_manager_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "PolicyRuleType" NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "scopeValue" TEXT,
    "conditions" JSONB NOT NULL,
    "effect" "PolicyEffect" NOT NULL,
    "effectPayload" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDecisionLog" (
    "id" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasonCode" TEXT,
    "context" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "module" "SubscriptionPlanModule" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "market_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "amountCents" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID,
    "user_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "plan_code" TEXT NOT NULL,
    "mrr_cents" INTEGER,
    "status" "subscription_status" NOT NULL,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID,
    "workspace_id" UUID,
    "user_id" TEXT,
    "event_type" "billing_event_type" NOT NULL,
    "stripe_event_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "workspace_id" UUID,
    "title" TEXT,
    "last_intent" "copilot_intent",
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "copilot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" "copilot_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "intent" "copilot_intent",
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copilot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" UUID,
    "query" TEXT NOT NULL,
    "intent" "copilot_intent" NOT NULL,
    "status" "copilot_run_status" NOT NULL,
    "confidence" DECIMAL(5,4),
    "summary" TEXT,
    "actions" JSONB,
    "insights" JSONB,
    "warnings" JSONB,
    "data" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "copilot_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_memory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "workspace_id" UUID,
    "memory_type" TEXT NOT NULL,
    "key" TEXT,
    "content" TEXT NOT NULL,
    "listing_id" TEXT,
    "city" TEXT,
    "property_type" TEXT,
    "embedding_vector" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "copilot_memory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedback_events" (
    "id" TEXT NOT NULL,
    "subsystem" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT,
    "prompt_or_query" TEXT NOT NULL,
    "output_summary" TEXT NOT NULL,
    "rating" INTEGER,
    "accepted" BOOLEAN,
    "action_taken" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_eval_runs" (
    "id" TEXT NOT NULL,
    "subsystem" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metrics" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "ai_eval_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_eval_items" (
    "id" TEXT NOT NULL,
    "eval_run_id" TEXT NOT NULL,
    "input_payload" JSONB NOT NULL,
    "expected_output" JSONB,
    "actual_output" JSONB NOT NULL,
    "passed" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_eval_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'visitor',
    "engagement_level" INTEGER NOT NULL DEFAULT 0,
    "analyses_count" INTEGER NOT NULL DEFAULT 0,
    "high_score_views" INTEGER NOT NULL DEFAULT 0,
    "repeat_listing_view" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "conversion_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_automation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "marketId" TEXT,
    "budgetCents" INTEGER,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "PromotionCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotedListing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "placement" "PromotionPlacement" NOT NULL,
    "costCents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_marketing_campaigns" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "created_by" TEXT,
    "campaign_name" TEXT NOT NULL,
    "objective" "BnhubMarketingCampaignObjective" NOT NULL,
    "status" "BnhubMarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "target_region" TEXT,
    "target_country" TEXT,
    "target_city" TEXT,
    "target_audience_json" JSONB,
    "budget_mode" "BnhubMarketingBudgetMode" NOT NULL DEFAULT 'NONE',
    "estimated_budget_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "ai_strategy_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_marketing_assets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "asset_type" "BnhubMarketingAssetType" NOT NULL,
    "language_code" TEXT NOT NULL DEFAULT 'en',
    "tone" "BnhubMarketingTone" NOT NULL DEFAULT 'PROFESSIONAL',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata_json" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "human_edited" BOOLEAN NOT NULL DEFAULT false,
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_marketing_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_distribution_channels" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel_type" "BnhubDistributionChannelType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_distribution_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_campaign_distributions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "distribution_status" "BnhubCampaignDistributionStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "payload_json" JSONB,
    "external_ref" TEXT,
    "result_summary" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "spend_cents" INTEGER NOT NULL DEFAULT 0,
    "revenue_attributed_cents" INTEGER NOT NULL DEFAULT 0,
    "roi_estimate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_campaign_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_listing_marketing_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "listing_quality_score" INTEGER NOT NULL DEFAULT 0,
    "photo_quality_score" INTEGER NOT NULL DEFAULT 0,
    "description_quality_score" INTEGER NOT NULL DEFAULT 0,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "pricing_score" INTEGER NOT NULL DEFAULT 0,
    "market_fit_score" INTEGER NOT NULL DEFAULT 0,
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "recommended_angle" TEXT,
    "recommended_languages_json" JSONB,
    "recommended_channels_json" JSONB,
    "missing_items_json" JSONB,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_listing_marketing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_marketing_events" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "distribution_id" TEXT,
    "event_type" "BnhubMarketingEventType" NOT NULL,
    "event_source" "BnhubMarketingEventSource" NOT NULL,
    "event_data_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_marketing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_marketing_recommendations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "recommendation_type" "BnhubMarketingRecommendationType" NOT NULL,
    "priority" "BnhubMarketingRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_label" TEXT NOT NULL,
    "action_payload_json" JSONB,
    "status" "BnhubMarketingRecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_marketing_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_email_campaign_queue" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "status" "BnhubEmailCampaignQueueStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_email_campaign_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_host_growth_prefs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "max_autonomy_level" "BnhubGrowthAutonomyLevel" NOT NULL DEFAULT 'ASSISTED',
    "daily_spend_cap_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_host_growth_prefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_campaigns" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "created_by" TEXT,
    "campaign_name" TEXT NOT NULL,
    "campaign_type" "BnhubGrowthCampaignType" NOT NULL,
    "objective" "BnhubGrowthCampaignObjective" NOT NULL,
    "autonomy_level" "BnhubGrowthAutonomyLevel" NOT NULL DEFAULT 'OFF',
    "status" "BnhubGrowthCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "primary_angle" TEXT,
    "target_region" TEXT,
    "target_country" TEXT,
    "target_city" TEXT,
    "target_audience_json" JSONB,
    "language_set_json" JSONB,
    "budget_mode" "BnhubGrowthBudgetMode" NOT NULL DEFAULT 'MANUAL',
    "budget_daily_cents" INTEGER,
    "budget_total_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "ai_strategy_summary" TEXT,
    "policy_flags_json" JSONB,
    "last_optimization_at" TIMESTAMP(3),
    "promo_slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_growth_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_assets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "asset_family" "BnhubGrowthAssetFamily" NOT NULL,
    "language_code" TEXT NOT NULL DEFAULT 'en',
    "tone" "BnhubMarketingTone" NOT NULL DEFAULT 'PROFESSIONAL',
    "platform_hint" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "cta_text" TEXT,
    "metadata_json" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "human_edited" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" "BnhubGrowthAssetApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_growth_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_connectors" (
    "id" TEXT NOT NULL,
    "connector_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connector_type" "BnhubGrowthConnectorType" NOT NULL,
    "status" "BnhubGrowthConnectorStatus" NOT NULL DEFAULT 'INACTIVE',
    "capabilities_json" JSONB,
    "config_json" JSONB,
    "last_healthcheck_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_growth_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_distributions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "asset_bundle_json" JSONB,
    "distribution_status" "BnhubGrowthDistributionStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "external_ref" TEXT,
    "destination_ref" TEXT,
    "payload_json" JSONB,
    "response_summary" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "spend_cents" INTEGER NOT NULL DEFAULT 0,
    "attributed_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "roi_estimate" DOUBLE PRECISION,
    "publish_attempt_count" INTEGER NOT NULL DEFAULT 0,
    "publish_locked_until" TIMESTAMP(3),
    "last_publish_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_growth_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_leads" (
    "id" TEXT NOT NULL,
    "source_type" "BnhubLeadSourceType" NOT NULL,
    "source_connector_code" TEXT,
    "external_lead_ref" TEXT,
    "listing_id" TEXT,
    "campaign_id" TEXT,
    "distribution_id" TEXT,
    "host_user_id" TEXT,
    "lead_type" "BnhubLeadType" NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "preferred_language" TEXT,
    "message" TEXT,
    "travel_dates_json" JSONB,
    "budget_min_cents" INTEGER,
    "budget_max_cents" INTEGER,
    "guest_count" INTEGER,
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "lead_temperature" "BnhubLeadTemperature" NOT NULL DEFAULT 'COLD',
    "status" "BnhubLeadStatus" NOT NULL DEFAULT 'NEW',
    "owner_user_id" TEXT,
    "enrichment_json" JSONB,
    "spam_score" INTEGER NOT NULL DEFAULT 0,
    "spam_reasons_json" JSONB,
    "response_due_at" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "dedupe_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_lead_events" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "event_type" "BnhubLeadEventType" NOT NULL,
    "event_source" "BnhubLeadEventSource" NOT NULL,
    "event_data_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_recommendations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "campaign_id" TEXT,
    "recommendation_type" "BnhubGrowthEngineRecommendationType" NOT NULL,
    "priority" "BnhubGrowthEngineRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_payload_json" JSONB,
    "status" "BnhubGrowthEngineRecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_growth_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_rules" (
    "id" TEXT NOT NULL,
    "scope_type" "BnhubGrowthRuleScopeType" NOT NULL,
    "scope_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rule_name" TEXT NOT NULL,
    "trigger_type" "BnhubGrowthRuleTriggerType" NOT NULL,
    "conditions_json" JSONB,
    "actions_json" JSONB,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_growth_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_connector_tokens" (
    "id" TEXT NOT NULL,
    "connector_code" TEXT NOT NULL,
    "owner_type" "BnhubConnectorTokenOwnerType" NOT NULL,
    "owner_id" TEXT,
    "token_status" "BnhubConnectorTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "encrypted_secret_ref" TEXT,
    "metadata_json" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_connector_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_growth_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "BnhubGrowthAuditActorType" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_growth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_revenue_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "revenue_type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'realized',
    "source_reference" TEXT,
    "market_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_revenue_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_opportunities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "lead_id" TEXT,
    "opportunity_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "value_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_metric_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_users" INTEGER NOT NULL,
    "active_users" INTEGER NOT NULL,
    "total_listings" INTEGER NOT NULL,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraising_investors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firm" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'contacted',
    "notes" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraising_investor_interactions" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fundraising_investor_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraising_deals" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraising_rounds" (
    "id" TEXT NOT NULL,
    "target_amount" DOUBLE PRECISION NOT NULL,
    "raised_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_commitments" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_execution_days" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "brokers_contacted" INTEGER NOT NULL DEFAULT 0,
    "hosts_contacted" INTEGER NOT NULL DEFAULT 0,
    "inquiries_generated" INTEGER NOT NULL DEFAULT 0,
    "bookings_completed" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_execution_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_execution_actions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'done',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_execution_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pitch_decks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pitch_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pitch_deck_slides" (
    "id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "pitch_deck_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_agents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority_weight" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_assignments" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_performance" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "leads_assigned" INTEGER NOT NULL DEFAULT 0,
    "deals_closed" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_candidates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "performance_flag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_candidate_interactions" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_candidate_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_candidate_evaluations" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "communication_score" INTEGER NOT NULL,
    "sales_skill_score" INTEGER NOT NULL,
    "execution_score" INTEGER NOT NULL,
    "speed_score" INTEGER NOT NULL DEFAULT 0,
    "clarity_score" INTEGER NOT NULL DEFAULT 0,
    "closing_score" INTEGER NOT NULL DEFAULT 0,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_candidate_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_candidate_trial_tasks" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "result_summary" TEXT,
    "response_quality" INTEGER,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_candidate_trial_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equity_holders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "equity_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equity_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equity_grants" (
    "id" TEXT NOT NULL,
    "holder_id" TEXT NOT NULL,
    "total_shares" DOUBLE PRECISION NOT NULL,
    "vesting_start" TIMESTAMP(3) NOT NULL,
    "vesting_duration" INTEGER NOT NULL,
    "cliff_months" INTEGER NOT NULL,
    "vested_shares" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equity_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_adjustments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "adjustment_type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "marketId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "GrowthCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcquisitionSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "campaignId" TEXT,
    "source" TEXT NOT NULL,
    "medium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcquisitionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "milestoneKey" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" "LifecycleStage" NOT NULL,
    "module" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketTaxRule" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ratePercent" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketTaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPolicyBinding" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "policyRuleKey" TEXT NOT NULL,
    "overridePayload" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPolicyBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueLedgerEntry" (
    "id" TEXT NOT NULL,
    "type" "RevenueLedgerType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "marketId" TEXT,
    "module" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "marketId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "marketId" TEXT,
    "gmvCents" INTEGER NOT NULL DEFAULT 0,
    "netRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "bookingsCount" INTEGER NOT NULL DEFAULT 0,
    "activeHostsCount" INTEGER NOT NULL DEFAULT 0,
    "activeBrokersCount" INTEGER NOT NULL DEFAULT 0,
    "mrrCents" INTEGER NOT NULL DEFAULT 0,
    "arrCents" INTEGER NOT NULL DEFAULT 0,
    "refundRate" DOUBLE PRECISION,
    "disputeRate" DOUBLE PRECISION,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFeature" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "valueJson" JSONB,
    "source" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "metrics" JSONB,
    "deployedAt" TIMESTAMP(3),
    "deprecatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudScore" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB,
    "modelVersion" TEXT,
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPricingRecommendation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "recommendedCents" INTEGER NOT NULL,
    "minCents" INTEGER,
    "maxCents" INTEGER,
    "demandLevel" TEXT NOT NULL,
    "minStayNights" INTEGER,
    "factors" JSONB,
    "modelVersion" TEXT,
    "forDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPricingRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchRankingScore" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB,
    "modelVersion" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchRankingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "propertyType" TEXT,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "demandLevel" DOUBLE PRECISION NOT NULL,
    "bookingsPredicted" INTEGER,
    "supplyGap" INTEGER,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAlert" (
    "id" TEXT NOT NULL,
    "alertType" "AiAlertType" NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "region" TEXT,
    "payload" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDecisionLog" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelVersion" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "explanation" TEXT,
    "overrideBy" TEXT,
    "overrideAt" TIMESTAMP(3),
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiOperatorDecision" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "inputSummary" JSONB,
    "outputSummary" JSONB,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "automatedAction" TEXT,
    "humanOverrideBy" TEXT,
    "humanOverrideAt" TIMESTAMP(3),
    "humanOverrideAction" TEXT,
    "humanOverrideNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiOperatorDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiOperatorAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiOperatorAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "risk_score" INTEGER,
    "trust_level" TEXT,
    "trust_score" DOUBLE PRECISION,
    "recommended_price_cents" INTEGER,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interaction_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" TEXT NOT NULL,
    "hub" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "decision_type" TEXT,
    "risk_level" TEXT,
    "input_summary" TEXT NOT NULL,
    "output_summary" TEXT NOT NULL,
    "model" TEXT,
    "source" TEXT NOT NULL DEFAULT 'openai',
    "feedback" TEXT,
    "metadata" JSONB,
    "legal_context" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_report_snapshots" (
    "id" TEXT NOT NULL,
    "period_type" "AdminReportPeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "summary_json" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queue_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "risk_score" INTEGER,
    "trust_score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recommended_action" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_design_references" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'canva',
    "design_url" TEXT NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_design_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_studio_trials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trial_ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_studio_trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trial_start" TIMESTAMP(3) NOT NULL,
    "trial_end" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "design_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canva_design_usages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trial_ends_at" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 5,

    CONSTRAINT "canva_design_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canva_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "usage_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_url" TEXT,
    "invoice_number" TEXT,

    CONSTRAINT "canva_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upgrade_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "plan" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_payment_id" TEXT,

    CONSTRAINT "upgrade_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_audit_logs" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "feature" TEXT,
    "plan" TEXT,
    "amount" DOUBLE PRECISION,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_storage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used_bytes" INTEGER NOT NULL DEFAULT 0,
    "limit_bytes" INTEGER NOT NULL,
    "alert_level" TEXT NOT NULL DEFAULT 'safe',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_assets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "title" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_file_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "mime_type" TEXT,
    "original_size" INTEGER NOT NULL DEFAULT 0,
    "compressed_size" INTEGER,
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "restored_at" TIMESTAMP(3),
    "retention_policy" TEXT NOT NULL DEFAULT 'standard',
    "optimization_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_file_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "user_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_legal_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporate_legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_structures" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_agreements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_form_signatures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "form_key" TEXT NOT NULL,
    "context_type" TEXT NOT NULL,
    "context_id" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "legal_form_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_agreements" (
    "id" TEXT NOT NULL,
    "agreement_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content_html" TEXT NOT NULL,
    "related_entity_type" TEXT NOT NULL,
    "related_entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "accepted_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "created_by_id" TEXT,
    "listing_id" TEXT,
    "fsbo_listing_id" TEXT,
    "booking_id" TEXT,
    "deal_id" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "content_html" TEXT,
    "content_text" TEXT,
    "content" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "is_signed" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3),
    "signer_ip_address" TEXT,
    "version" TEXT,
    "hub" TEXT,
    "external_provider" TEXT,
    "external_envelope_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_contract_audit_logs" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "version" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_contract_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_commission_records" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "booking_id" TEXT,
    "contract_id" TEXT,
    "commission_eligible" BOOLEAN NOT NULL DEFAULT false,
    "commission_source" TEXT,
    "commission_amount_cents" INTEGER,
    "platform_share_cents" INTEGER,
    "partner_share_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_legal_disputes" (
    "id" TEXT NOT NULL,
    "dispute_code" TEXT,
    "type" TEXT NOT NULL,
    "booking_id" TEXT,
    "listing_id" TEXT,
    "fsbo_listing_id" TEXT,
    "deal_id" TEXT,
    "lead_id" TEXT,
    "platform_invoice_id" TEXT,
    "platform_payment_id" TEXT,
    "opened_by_user_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "description" TEXT NOT NULL,
    "evidence_urls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_legal_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "signature_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "listing_id" TEXT,
    "lead_id" TEXT,
    "contract_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "offer_price_cents" INTEGER,
    "conditionsJson" JSONB,
    "content_html" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_transaction_records" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "contract_id" TEXT,
    "offer_document_id" TEXT,
    "transaction_type" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "gross_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "broker_commission_cents" INTEGER NOT NULL DEFAULT 0,
    "platform_commission_cents" INTEGER NOT NULL DEFAULT 0,
    "expenses_cents" INTEGER NOT NULL DEFAULT 0,
    "net_broker_income_cents" INTEGER NOT NULL DEFAULT 0,
    "loss_reason" TEXT,
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_transaction_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_expenses" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "transaction_record_id" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "tax_gst_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_qst_cents" INTEGER NOT NULL DEFAULT 0,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_report_snapshots" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "gst_collected_cents" INTEGER NOT NULL DEFAULT 0,
    "qst_collected_cents" INTEGER NOT NULL DEFAULT 0,
    "taxable_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "non_taxable_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "source_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "subtotal_cents" INTEGER NOT NULL DEFAULT 0,
    "gst_cents" INTEGER NOT NULL DEFAULT 0,
    "qst_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_records" (
    "id" TEXT NOT NULL,
    "accounting_entry_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "welcome_tax_municipality_configs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brackets_json" JSONB NOT NULL,
    "rebate_rules_json" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welcome_tax_municipality_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentive_program_configs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "external_link" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incentive_program_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_usage_events" (
    "id" TEXT NOT NULL,
    "tool_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL DEFAULT 'view',
    "city" TEXT,
    "user_id" TEXT,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "listing_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT,
    "email" TEXT,
    "budget_cents" INTEGER,
    "down_payment_cents" INTEGER,
    "target_cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strategy" TEXT,
    "risk_tolerance" TEXT,
    "property_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_roi_percent" DOUBLE PRECISION,
    "target_cash_flow_cents" INTEGER,
    "time_horizon_years" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_scenarios" (
    "id" TEXT NOT NULL,
    "investor_profile_id" TEXT,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "strategy" TEXT,
    "scenario_kind" TEXT,
    "total_budget_cents" INTEGER NOT NULL DEFAULT 0,
    "total_down_payment_cents" INTEGER NOT NULL DEFAULT 0,
    "projected_monthly_cash_flow_cents" INTEGER NOT NULL DEFAULT 0,
    "projected_annual_cash_flow_cents" INTEGER NOT NULL DEFAULT 0,
    "projected_average_roi_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projected_average_cap_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projected_risk_level" TEXT,
    "projected_diversification_score" DOUBLE PRECISION,
    "insights_json" JSONB,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_scenario_items" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "purchase_price_cents" INTEGER NOT NULL,
    "estimated_rent_cents" INTEGER,
    "projected_roi_percent" DOUBLE PRECISION,
    "projected_cap_rate" DOUBLE PRECISION,
    "projected_cash_flow_cents" INTEGER,
    "city" TEXT,
    "property_type" TEXT,
    "risk_level" TEXT,
    "market_trend" TEXT,
    "fit_score" DOUBLE PRECISION,
    "strength_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_scenario_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_portfolio_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "city" TEXT,
    "target_roi_percent" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_portfolio_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_agreements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hub" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcceptanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marketId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "PolicyAcceptanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalEventLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "marketId" TEXT,
    "payload" JSONB,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceRecord" (
    "id" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mimeType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "retentionUntil" TIMESTAMP(3),
    "checksum" TEXT,

    CONSTRAINT "EvidenceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceAccessLog" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "accessedBy" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbuseSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "signalType" "AbuseSignalType" NOT NULL,
    "severity" TEXT NOT NULL,
    "payload" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbuseSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffenderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strikeCount" INTEGER NOT NULL DEFAULT 0,
    "lastStrikeAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "bannedAt" TIMESTAMP(3),
    "linkedAccountIds" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffenderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivilegedAdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "reasonCode" TEXT,
    "reasonText" TEXT,
    "approvalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivilegedAdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "reasonCode" TEXT,
    "payload" JSONB,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "CrisisSeverity" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "region" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "playbookRef" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrisisEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisActionLog" (
    "id" TEXT NOT NULL,
    "crisisId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "performedBy" TEXT NOT NULL,
    "reasonCode" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRequirement" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "requirementKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReview" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "marketId" TEXT,
    "status" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "notes" TEXT,
    "documentRefs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRiskFlag" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "flagType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "amountCents" INTEGER,
    "payload" JSONB,
    "createdBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialRiskFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnforcementAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "EnforcementActionType" NOT NULL,
    "severity" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "reasonText" TEXT,
    "marketId" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "performedBy" TEXT,
    "appealId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnforcementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL,
    "enforcementId" TEXT,
    "userId" TEXT NOT NULL,
    "reasonCode" TEXT,
    "description" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "outcomeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_safety_incidents" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "accused_user_id" TEXT,
    "listing_id" TEXT,
    "booking_id" TEXT,
    "incident_category" TEXT NOT NULL,
    "severity_level" "TrustSafetySeverity" NOT NULL DEFAULT 'MEDIUM',
    "risk_score" DOUBLE PRECISION,
    "risk_level" "TrustSafetyRiskLevel",
    "status" "TrustSafetyIncidentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "urgency_level" TEXT,
    "description" TEXT NOT NULL,
    "incidentTime" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution_notes" TEXT,

    CONSTRAINT "trust_safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_safety_evidence" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "label" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_safety_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_safety_actions" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "action_type" "TrustSafetyActionType" NOT NULL,
    "reason_code" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "trust_safety_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_safety_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "host_risk_score" DOUBLE PRECISION,
    "guest_risk_score" DOUBLE PRECISION,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "suspension_count" INTEGER NOT NULL DEFAULT 0,
    "serious_incident_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_safety_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_safety_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "safety_score" DOUBLE PRECISION,
    "complaint_count" INTEGER NOT NULL DEFAULT 0,
    "unsafe_incident_count" INTEGER NOT NULL DEFAULT 0,
    "fraud_incident_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_safety_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_safety_appeals" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "action_id" TEXT,
    "submitted_by" TEXT NOT NULL,
    "appeal_reason" TEXT NOT NULL,
    "status" "TrustSafetyAppealStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_safety_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_safety_incident_responses" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "respondent_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_safety_incident_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefenseMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "marketId" TEXT,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "disputeCount" INTEGER NOT NULL DEFAULT 0,
    "disputeRate" DOUBLE PRECISION,
    "fraudLossCents" INTEGER NOT NULL DEFAULT 0,
    "abuseSignalsCount" INTEGER NOT NULL DEFAULT 0,
    "suspensionCount" INTEGER NOT NULL DEFAULT 0,
    "appealCount" INTEGER NOT NULL DEFAULT 0,
    "appealApprovalRate" DOUBLE PRECISION,
    "payoutHoldCount" INTEGER NOT NULL DEFAULT 0,
    "complianceFailures" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefenseMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "listing_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "owner_id" TEXT,
    "tenant_id" TEXT,
    "commission_category" "ListingCommissionCategory" NOT NULL DEFAULT 'SALE',
    "commission_rate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_listing_access" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "granted_by_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_listing_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "listingId" TEXT,
    "fsbo_listing_id" TEXT,
    "short_term_listing_id" TEXT,
    "listing_code" TEXT,
    "projectId" TEXT,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "source" TEXT,
    "campaign" TEXT,
    "medium" TEXT,
    "lead_source" TEXT,
    "lead_type" TEXT,
    "assigned_expert_id" TEXT,
    "mortgage_marketplace_status" TEXT,
    "mortgage_inquiry" JSONB,
    "ai_tier" TEXT,
    "user_id" TEXT,
    "ai_explanation" JSONB,
    "contact_unlocked_at" TIMESTAMP(3),
    "introduced_by_broker_id" TEXT,
    "last_follow_up_by_broker_id" TEXT,
    "last_follow_up_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pipeline_status" TEXT NOT NULL DEFAULT 'new',
    "pipeline_stage" TEXT NOT NULL DEFAULT 'new',
    "opted_out_of_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "deal_value" INTEGER,
    "estimated_value" INTEGER,
    "conversion_probability" DOUBLE PRECISION,
    "value_source" TEXT,
    "revenue_tier" TEXT,
    "mortgage_credit_cost" INTEGER NOT NULL DEFAULT 1,
    "dynamic_lead_price_cents" INTEGER,
    "service_commission_rate" DOUBLE PRECISION,
    "mortgage_assigned_at" TIMESTAMP(3),
    "mortgage_sla_reminder_at" TIMESTAMP(3),
    "revenue_ab_variant" TEXT,
    "purchase_region" TEXT,
    "commission_estimate" INTEGER,
    "last_contacted_at" TIMESTAMP(3),
    "first_contact_at" TIMESTAMP(3),
    "last_contact_at" TIMESTAMP(3),
    "qualified_at" TIMESTAMP(3),
    "meeting_scheduled_at" TIMESTAMP(3),
    "closing_at" TIMESTAMP(3),
    "won_at" TIMESTAMP(3),
    "lost_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "post_meeting_outcome" TEXT,
    "deal_outcome_notes" TEXT,
    "final_deal_value" INTEGER,
    "next_action_at" TIMESTAMP(3),
    "next_follow_up_at" TIMESTAMP(3),
    "reminder_status" TEXT,
    "meeting_at" TIMESTAMP(3),
    "meeting_completed" BOOLEAN NOT NULL DEFAULT false,
    "final_sale_price" INTEGER,
    "final_commission" INTEGER,
    "deal_closed_at" TIMESTAMP(3),
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "dm_status" TEXT NOT NULL DEFAULT 'none',
    "outreach_coaching_stage" TEXT,
    "last_dm_at" TIMESTAMP(3),
    "engagement_score" INTEGER NOT NULL DEFAULT 0,
    "lecipm_lead_score" INTEGER,
    "lecipm_deal_quality_score" INTEGER,
    "lecipm_trust_score" INTEGER,
    "lecipm_urgency_score" INTEGER,
    "lecipm_crm_stage" TEXT DEFAULT 'new_lead',
    "crm_intent_score" INTEGER NOT NULL DEFAULT 0,
    "crm_urgency_score" INTEGER NOT NULL DEFAULT 0,
    "crm_trust_score" INTEGER NOT NULL DEFAULT 0,
    "crm_friction_score" INTEGER NOT NULL DEFAULT 0,
    "crm_last_activity_at" TIMESTAMP(3),
    "crm_next_best_action" TEXT,
    "crm_priority_score" INTEGER NOT NULL DEFAULT 0,
    "crm_execution_stage" TEXT NOT NULL DEFAULT 'browsing',
    "lecipm_scores_computed_at" TIMESTAMP(3),
    "score_level" TEXT,
    "evaluation_email_status" TEXT NOT NULL DEFAULT 'none',
    "last_automation_email_at" TIMESTAMP(3),
    "launch_sales_contacted" BOOLEAN NOT NULL DEFAULT false,
    "launch_last_contact_date" TIMESTAMP(3),
    "launch_notes" TEXT,
    "contact_origin" "LeadContactOrigin",
    "commission_source" "LeadContactOrigin",
    "first_platform_contact_at" TIMESTAMP(3),
    "commission_eligible" BOOLEAN NOT NULL DEFAULT false,
    "platform_conversation_id" TEXT,
    "workspace_id" UUID,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_crm_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'platform',
    "user_id" TEXT,
    "session_id" TEXT,
    "lead_id" TEXT,
    "short_term_listing_id" TEXT,
    "fsbo_listing_id" TEXT,
    "booking_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "internal_crm_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_contact_audit_events" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "listing_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_contact_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_session_id" TEXT,
    "expert_id" TEXT,
    "lead_id" TEXT,
    "metadata" JSONB,
    "expert_last_read_at" TIMESTAMP(3),
    "convo_intent_score" INTEGER NOT NULL DEFAULT 0,
    "convo_urgency_score" INTEGER NOT NULL DEFAULT 0,
    "convo_trust_score" INTEGER NOT NULL DEFAULT 0,
    "convo_friction_score" INTEGER NOT NULL DEFAULT 0,
    "convo_last_activity_at" TIMESTAMP(3),
    "convo_next_best_action" TEXT,
    "convo_priority_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_automation_tasks" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lead_automation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tasks" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "task_key" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "path" TEXT,
    "meta" JSONB,
    "source" TEXT,
    "campaign" TEXT,
    "medium" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traffic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "manual_ad_spend_cad" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluate_funnel_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "evaluate_funnel_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "lead_contact_consents" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "consent_sms_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "consent_voice" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "source_page" TEXT,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_contact_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_comm_messages" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template_key" TEXT,
    "body" TEXT NOT NULL,
    "external_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "locale" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_comm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_timeline_events" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_follow_up_jobs" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "job_key" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_up_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_follow_up_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "enable_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "enable_sms" BOOLEAN NOT NULL DEFAULT true,
    "enable_voice" BOOLEAN NOT NULL DEFAULT false,
    "minutes_to_second_touch" INTEGER NOT NULL DEFAULT 20,
    "hours_to_day_one_touch" INTEGER NOT NULL DEFAULT 24,
    "days_to_final_touch" INTEGER NOT NULL DEFAULT 3,
    "hot_score_threshold" INTEGER NOT NULL DEFAULT 75,
    "require_explicit_consent" BOOLEAN NOT NULL DEFAULT true,
    "broker_notify_email" BOOLEAN NOT NULL DEFAULT true,
    "voice_delay_minutes" INTEGER NOT NULL DEFAULT 5,
    "templates_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_follow_up_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_close_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_close_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_close_audit_events" (
    "id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "safe_mode" BOOLEAN NOT NULL,
    "detail" JSONB,
    "reverted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_close_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_playbooks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "conversion_playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "conversion_playbook_executions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "lead_id" TEXT,
    "playbook_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_playbook_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_interactions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "broker_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_retention_touchpoints" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "template_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_retention_touchpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_user_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "listing_id" TEXT,
    "project_id" TEXT,
    "search_query" TEXT,
    "duration_seconds" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendation_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "source" TEXT NOT NULL,
    "rank_score" DOUBLE PRECISION,
    "explanation" TEXT,
    "presented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked_at" TIMESTAMP(3),

    CONSTRAINT "ai_recommendation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_marketing_content" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "content_type" TEXT NOT NULL,
    "template_key" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_marketing_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viral_short_script_records" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "topic" TEXT NOT NULL,
    "hook_type" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "primary_platform" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "demo_idea" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "platform_notes" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "watch_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viral_short_script_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_profiles" (
    "user_id" TEXT NOT NULL,
    "behavior_lead_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_tier" TEXT,
    "score_breakdown" JSONB,
    "fraud_heuristic_score" INTEGER NOT NULL DEFAULT 0,
    "ai_flags" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ai_automation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "broker_id" TEXT,
    "event_key" TEXT NOT NULL,
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_client_chat_sessions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listing_id" TEXT,
    "project_id" TEXT,
    "lead_id" TEXT,
    "tier" TEXT,
    "score" INTEGER,
    "transcript" JSONB NOT NULL,
    "answers" JSONB,
    "compliance_tag" TEXT DEFAULT 'quebec_real_estate_v1',

    CONSTRAINT "ai_client_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_follow_ups" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_conversations" (
    "id" TEXT NOT NULL,
    "broker1_id" TEXT NOT NULL,
    "broker2_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "startingPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "propertyType" TEXT,
    "category" TEXT,
    "listingType" TEXT,
    "bedroomsMin" INTEGER,
    "bathroomsMin" INTEGER,
    "garageCount" INTEGER,
    "parkingOutside" INTEGER,
    "storageUnit" BOOLEAN,
    "pool" BOOLEAN,
    "elevator" BOOLEAN,
    "adaptedMobility" BOOLEAN,
    "waterfront" BOOLEAN,
    "waterAccess" BOOLEAN,
    "navigableWater" BOOLEAN,
    "resort" BOOLEAN,
    "petsAllowed" BOOLEAN,
    "smokingAllowed" BOOLEAN,
    "livingAreaMin" INTEGER,
    "livingAreaMax" INTEGER,
    "constructionYearMin" INTEGER,
    "constructionYearMax" INTEGER,
    "newConstruction" BOOLEAN,
    "centuryHistoric" BOOLEAN,
    "bungalow" BOOLEAN,
    "multiStorey" BOOLEAN,
    "splitLevel" BOOLEAN,
    "detached" BOOLEAN,
    "semiDetached" BOOLEAN,
    "attached" BOOLEAN,
    "plexType" TEXT,
    "landAreaMin" INTEGER,
    "landAreaMax" INTEGER,
    "newSince" TIMESTAMP(3),
    "moveInDate" TIMESTAMP(3),
    "openHouses" BOOLEAN,
    "repossession" BOOLEAN,
    "pedestrianFriendly" BOOLEAN,
    "transitFriendly" BOOLEAN,
    "carFriendly" BOOLEAN,
    "groceryNearby" BOOLEAN,
    "primarySchoolsNearby" BOOLEAN,
    "secondarySchoolsNearby" BOOLEAN,
    "daycaresNearby" BOOLEAN,
    "restaurantsNearby" BOOLEAN,
    "cafesNearby" BOOLEAN,
    "nightlifeNearby" BOOLEAN,
    "shoppingNearby" BOOLEAN,
    "quiet" BOOLEAN,
    "vibrant" BOOLEAN,
    "heroImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubscription" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "isTrial" BOOLEAN NOT NULL DEFAULT true,
    "trialEnd" TIMESTAMP(3) NOT NULL,
    "plan" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLeadPayment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectLeadPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPricingConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProjectPricingConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ProjectUnit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ProjectUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProjectSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProjectSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "maxPrice" DOUBLE PRECISION,
    "minPrice" DOUBLE PRECISION,
    "projectId" TEXT,
    "deliveryYear" INTEGER,
    "alertType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectUnitId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityPreference" TEXT,
    "minBudget" DOUBLE PRECISION,
    "maxBudget" DOUBLE PRECISION,
    "minBedrooms" INTEGER,
    "investmentGoal" TEXT,
    "preferredDeliveryYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorPortfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "unitId" TEXT,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_deals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "rental_type" TEXT NOT NULL DEFAULT 'LONG_TERM',
    "property_price" DOUBLE PRECISION NOT NULL,
    "monthly_rent" DOUBLE PRECISION NOT NULL,
    "monthly_expenses" DOUBLE PRECISION NOT NULL,
    "nightly_rate" DOUBLE PRECISION,
    "occupancy_rate" DOUBLE PRECISION,
    "roi_long_term" DOUBLE PRECISION,
    "roi_short_term" DOUBLE PRECISION,
    "preferred_strategy" TEXT NOT NULL DEFAULT 'LONG_TERM',
    "roi" DOUBLE PRECISION NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "market_comparison" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_deal_visits" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "referrer_deal_id" TEXT,
    "referrer_user_id" TEXT,
    "session_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_deal_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_access_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(160),
    "role" VARCHAR(64),
    "source" VARCHAR(64),
    "referrer" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_access_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_users_tracking" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160),
    "type" "EarlyUserTrackingType" NOT NULL,
    "contact" VARCHAR(320) NOT NULL,
    "status" "EarlyUserTrackingStatus" NOT NULL DEFAULT 'CONTACTED',
    "source" VARCHAR(64),
    "conversion_stage" VARCHAR(64),
    "conversion_date" TIMESTAMP(3),
    "follow_up_at" TIMESTAMP(3),
    "conversion_score" INTEGER,
    "lead_tier" "LeadPriorityTier",
    "last_outreach_at" TIMESTAMP(3),
    "notes" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "early_users_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_lead_captures" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(64),
    "intent" "EarlyUserTrackingType" NOT NULL,
    "source" VARCHAR(64),
    "utm_source" VARCHAR(128),
    "utm_medium" VARCHAR(64),
    "utm_campaign" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_lead_captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_leads" (
    "id" TEXT NOT NULL,
    "company_name" VARCHAR(320) NOT NULL,
    "contact_name" VARCHAR(160),
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(64),
    "segment" "EnterpriseLeadSegment" NOT NULL,
    "stage" "EnterpriseLeadStage" NOT NULL DEFAULT 'LEAD_IDENTIFIED',
    "notes" TEXT,
    "deal_value_estimate_cents" INTEGER,
    "follow_up_at" TIMESTAMP(3),
    "lead_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_feedback" (
    "id" TEXT NOT NULL,
    "liked" TEXT,
    "confusing" TEXT,
    "suggestions" TEXT,
    "path" VARCHAR(512),
    "userAgent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "early_user_tagged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "eventType" "UserEventType" NOT NULL,
    "metadata" JSONB,
    "sessionId" VARCHAR(64),
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_stripe_webhook_logs" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "booking_id" TEXT,
    "payment_intent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_stripe_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "growth_email_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "GrowthEmailQueueType" NOT NULL,
    "payload" JSONB,
    "status" "GrowthEmailQueueStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "subject" TEXT,
    "body_preview" TEXT,
    "trigger_event" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to_id" TEXT,
    "context_json" JSONB,
    "human_takeover_at" TIMESTAMP(3),
    "ai_reply_pending" BOOLEAN NOT NULL DEFAULT false,
    "last_automated_at" TIMESTAMP(3),
    "silent_nudge_sent_at" TIMESTAMP(3),
    "outcome" VARCHAR(32),
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "last_user_message_at" TIMESTAMP(3),
    "last_ai_message_at" TIMESTAMP(3),
    "last_human_message_at" TIMESTAMP(3),
    "stale_marked_at" TIMESTAMP(3),
    "high_intent_assist_nudge_sent_at" TIMESTAMP(3),
    "stage" VARCHAR(24) NOT NULL DEFAULT 'new',
    "recommended_template_key" VARCHAR(64),
    "learning_flag" VARCHAR(32),
    "growth_ai_outcome" TEXT,
    "growth_ai_outcome_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "detected_intent" TEXT,
    "detected_objection" TEXT,
    "confidence" DOUBLE PRECISION,
    "handoff_required" BOOLEAN NOT NULL DEFAULT false,
    "template_key" TEXT,
    "cta_type" VARCHAR(32),
    "is_nudge" BOOLEAN NOT NULL DEFAULT false,
    "is_assist_close" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_assistant_insights" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "detected_intent" TEXT NOT NULL,
    "detected_objection" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "message_suggestion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_assistant_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_reply_rules" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "objection" TEXT,
    "stage" TEXT,
    "template_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_reply_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_reply_templates" (
    "id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cta_type" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'helpful',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_reply_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_conversation_handoffs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversation_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_template_performance" (
    "id" TEXT NOT NULL,
    "template_key" VARCHAR(64) NOT NULL,
    "stage" VARCHAR(32) NOT NULL DEFAULT '',
    "detected_intent" VARCHAR(48) NOT NULL DEFAULT '',
    "detected_objection" VARCHAR(32) NOT NULL DEFAULT '',
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "qualified_count" INTEGER NOT NULL DEFAULT 0,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "handoff_count" INTEGER NOT NULL DEFAULT 0,
    "stale_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_template_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_routing_experiments" (
    "id" TEXT NOT NULL,
    "experiment_key" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "control_template_key" VARCHAR(64) NOT NULL,
    "variant_template_key" VARCHAR(64) NOT NULL,
    "stage" VARCHAR(32),
    "detected_intent" VARCHAR(48),
    "detected_objection" VARCHAR(32),
    "high_intent" BOOLEAN,
    "allocation_percent" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_routing_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_conversation_decisions" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT,
    "stage" VARCHAR(32),
    "detected_intent" VARCHAR(48),
    "detected_objection" VARCHAR(32),
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "selected_template_key" VARCHAR(64) NOT NULL,
    "reason_json" JSONB,
    "was_experiment" BOOLEAN NOT NULL DEFAULT false,
    "experiment_key" VARCHAR(64),
    "outcome_at_selection" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversation_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_template_outcome_events" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "event_key" VARCHAR(48) NOT NULL,
    "decision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_template_outcome_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_learning_manual_overrides" (
    "id" TEXT NOT NULL,
    "stage" VARCHAR(32) NOT NULL DEFAULT '',
    "detected_intent" VARCHAR(48) NOT NULL DEFAULT '',
    "detected_objection" VARCHAR(32) NOT NULL DEFAULT '',
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "override_template_key" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_learning_manual_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_lead_orchestrations" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT,
    "listing_id" TEXT,
    "booking_id" TEXT,
    "route_type" VARCHAR(32),
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "urgency_score" INTEGER NOT NULL DEFAULT 0,
    "assignment_status" VARCHAR(32) NOT NULL DEFAULT 'unassigned',
    "assigned_broker_id" TEXT,
    "assigned_host_id" TEXT,
    "assigned_admin_id" TEXT,
    "next_action_type" VARCHAR(32),
    "next_action_due_at" TIMESTAMP(3),
    "last_action_at" TIMESTAMP(3),
    "conversion_goal" VARCHAR(32),
    "automation_paused" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3),
    "last_orchestration_template_key" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_lead_orchestrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_action_logs" (
    "id" TEXT NOT NULL,
    "orchestration_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_payload" JSONB,
    "result_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_ai_assignment_rules" (
    "id" TEXT NOT NULL,
    "route_type" VARCHAR(32) NOT NULL,
    "city" VARCHAR(64),
    "property_type" VARCHAR(32),
    "broker_id" TEXT,
    "host_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_assignment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_type" VARCHAR(16) NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_recommendations" (
    "id" TEXT NOT NULL,
    "recommendation_type" VARCHAR(64) NOT NULL,
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(24) NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details_json" JSONB NOT NULL,
    "evidence_json" JSONB,
    "target_entity_type" VARCHAR(32),
    "target_entity_id" TEXT,
    "safe_auto_action_key" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_action_runs" (
    "id" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "recommendation_id" TEXT,
    "result_status" TEXT NOT NULL,
    "result_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_action_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_entity_scores" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score_type" VARCHAR(32) NOT NULL,
    "score_value" DOUBLE PRECISION NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_entity_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "rating" INTEGER,
    "message" TEXT,
    "page" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monopoly_expansion_cities" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seo_path" TEXT,
    "campaigns_enabled" BOOLEAN NOT NULL DEFAULT true,
    "launched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monopoly_expansion_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monopoly_competitor_snapshots" (
    "id" TEXT NOT NULL,
    "city_slug" TEXT NOT NULL,
    "competitor_key" TEXT NOT NULL,
    "platform_listing_count" INTEGER,
    "competitor_estimate" INTEGER,
    "avg_price_cents_ours" INTEGER,
    "avg_price_cents_theirs" INTEGER,
    "feature_gap_json" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monopoly_competitor_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "clientName" TEXT,
    "clientEmail" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormActivity" (
    "id" TEXT NOT NULL,
    "formSubmissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "city" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "image" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "summary" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "image" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_acquisition_leads" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'facebook',
    "phone" TEXT,
    "notes" TEXT,
    "message_sent" BOOLEAN NOT NULL DEFAULT false,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "interested" BOOLEAN NOT NULL DEFAULT false,
    "call_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "message_sent_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "interested_at" TIMESTAMP(3),
    "call_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "service_type" TEXT,
    "value_cents" INTEGER,
    "revenue_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_acquisition_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_acquisition_daily_progress" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "contacts_count" INTEGER NOT NULL DEFAULT 0,
    "leads_count" INTEGER NOT NULL DEFAULT 0,
    "calls_booked_count" INTEGER NOT NULL DEFAULT 0,
    "clients_closed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_acquisition_daily_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "launch_phase_daily_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "replies_received" INTEGER NOT NULL DEFAULT 0,
    "demos_booked" INTEGER NOT NULL DEFAULT 0,
    "demos_completed" INTEGER NOT NULL DEFAULT 0,
    "users_created" INTEGER NOT NULL DEFAULT 0,
    "activated_users" INTEGER NOT NULL DEFAULT 0,
    "paying_users" INTEGER NOT NULL DEFAULT 0,
    "posts_created" INTEGER NOT NULL DEFAULT 0,
    "content_views" INTEGER NOT NULL DEFAULT 0,
    "content_clicks" INTEGER NOT NULL DEFAULT 0,
    "content_conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "launch_phase_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spell_dictionary_entries" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'both',
    "word" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'allow',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spell_dictionary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_writer_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "action" TEXT,
    "prompt_len" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_writer_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "listings_broker" INTEGER NOT NULL DEFAULT 0,
    "listings_self" INTEGER NOT NULL DEFAULT 0,
    "transactions_closed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_offers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "tenant_id" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "offered_price" DOUBLE PRECISION NOT NULL,
    "down_payment_amount" DOUBLE PRECISION,
    "financing_needed" BOOLEAN,
    "closing_date" TIMESTAMP(3),
    "conditions" TEXT,
    "message" TEXT,
    "scenario" JSONB,
    "commission_eligible" BOOLEAN NOT NULL DEFAULT true,
    "commission_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_offer_events" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_id" TEXT,
    "type" "OfferEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_offer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_clients" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "BrokerClientStatus" NOT NULL DEFAULT 'LEAD',
    "source" TEXT,
    "budget_min" DOUBLE PRECISION,
    "budget_max" DOUBLE PRECISION,
    "target_city" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_client_interactions" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "BrokerInteractionType" NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_client_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_client_listings" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "kind" "BrokerClientListingKind" NOT NULL DEFAULT 'SAVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_client_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_rules" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "client_user_id" TEXT,
    "broker_client_id" TEXT,
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "meeting_mode" "MeetingMode" NOT NULL DEFAULT 'IN_PERSON',
    "requested_by_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "reschedule_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_events" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_id" TEXT,
    "type" "AppointmentEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
    "tenant_id" TEXT,
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "appointment_id" TEXT,
    "broker_client_id" TEXT,
    "created_by_id" TEXT,
    "subject" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_label" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "last_read_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_events" (
    "id" TEXT NOT NULL,
    "message_id" TEXT,
    "conversation_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "MessageEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_folders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "DocumentFolderType" NOT NULL DEFAULT 'GENERAL',
    "listing_id" TEXT,
    "broker_client_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "appointment_id" TEXT,
    "conversation_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_files" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "folder_id" TEXT,
    "uploaded_by_id" TEXT,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "storage_provider" TEXT,
    "checksum" TEXT,
    "status" "DocumentFileStatus" NOT NULL DEFAULT 'AVAILABLE',
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PRIVATE_INTERNAL',
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "listing_id" TEXT,
    "broker_client_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "appointment_id" TEXT,
    "conversation_id" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workspace_id" UUID,

    CONSTRAINT "document_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_grants" (
    "id" TEXT NOT NULL,
    "document_file_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access" "DocumentAccessLevel" NOT NULL DEFAULT 'VIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_events" (
    "id" TEXT NOT NULL,
    "document_file_id" TEXT,
    "folder_id" TEXT,
    "actor_id" TEXT,
    "type" "DocumentEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_intake_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "broker_client_id" TEXT NOT NULL,
    "user_id" TEXT,
    "legal_first_name" TEXT,
    "legal_last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "employment_status" TEXT,
    "annual_income" DOUBLE PRECISION,
    "estimated_assets" DOUBLE PRECISION,
    "estimated_liabilities" DOUBLE PRECISION,
    "residency_status" TEXT,
    "citizenship_country" TEXT,
    "marital_status" TEXT,
    "current_address" TEXT,
    "city" TEXT,
    "province_state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "status" "ClientIntakeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_intake_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "required_document_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "broker_client_id" TEXT NOT NULL,
    "intake_profile_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "RequiredDocumentCategory" NOT NULL,
    "status" "RequiredDocumentStatus" NOT NULL DEFAULT 'REQUIRED',
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "requested_by_id" TEXT,
    "due_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "linked_document_file_id" TEXT,
    "rejection_reason" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "required_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_intake_events" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "intake_profile_id" TEXT,
    "required_document_item_id" TEXT,
    "actor_id" TEXT,
    "type" "ClientIntakeEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_intake_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "action_url" TEXT,
    "action_label" TEXT,
    "actor_id" TEXT,
    "listing_id" TEXT,
    "broker_client_id" TEXT,
    "intake_profile_id" TEXT,
    "required_document_item_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "appointment_id" TEXT,
    "conversation_id" TEXT,
    "document_file_id" TEXT,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_queue_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "type" "ActionQueueItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActionQueueItemStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "source_key" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "action_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT,
    "action_queue_item_id" TEXT,
    "actor_id" TEXT,
    "type" "NotificationEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "owner_user_id" TEXT,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL,
    "status" "TenantMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_financials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "sale_price" DOUBLE PRECISION,
    "rent_amount" DOUBLE PRECISION,
    "commission_amount" DOUBLE PRECISION,
    "commission_source" TEXT,
    "rental_category" TEXT,
    "commission_rate" DOUBLE PRECISION,
    "gross_commission" DOUBLE PRECISION,
    "net_commission" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_financials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_splits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_financial_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role_label" TEXT,
    "percent" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "type" "TenantInvoiceType" NOT NULL,
    "status" "TenantInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "client_name" TEXT,
    "client_email" TEXT,
    "bill_to_data" JSONB,
    "line_items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "due_at" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "broker_client_id" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tenant_invoice_id" TEXT,
    "deal_financial_id" TEXT,
    "type" "PaymentRecordType" NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "provider" TEXT,
    "provider_ref" TEXT,
    "paid_by_name" TEXT,
    "paid_by_email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_billing_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "legal_name" TEXT,
    "billing_email" TEXT,
    "address_data" JSONB,
    "tax_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_billing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_user_id" TEXT,
    "name" TEXT,
    "email" TEXT,
    "company" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'lead',
    "source" TEXT,
    "notes" TEXT,
    "last_contacted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "type" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" BIGSERIAL NOT NULL,
    "owner_user_id" TEXT,
    "broker_user_id" TEXT,
    "fsbo_listing_id" TEXT,
    "mode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "address_line1" TEXT,
    "unit_number" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(4,1),
    "area_sqft" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "plan_type" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_property_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "media_kind" TEXT NOT NULL,
    "media_tag" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "file_hash" TEXT,
    "perceptual_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_property_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_declarations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" BIGINT NOT NULL,
    "seller_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "completion_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seller_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_declaration_drafts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_user_id" TEXT,
    "admin_user_id" TEXT,
    "status" "SellerDeclarationDraftStatus" NOT NULL DEFAULT 'draft',
    "draft_payload" JSONB NOT NULL DEFAULT '{}',
    "validation_summary" JSONB,
    "ai_summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seller_declaration_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_declaration_ai_events" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "prompt_context" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_declaration_ai_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_audit_logs" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_signatures" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_email" TEXT NOT NULL,
    "status" "DocumentSignatureStatus" NOT NULL DEFAULT 'pending',
    "signed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "negotiation_version_id" TEXT,

    CONSTRAINT "document_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_graph_nodes" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "legal_graph_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_graph_edges" (
    "id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_graph_issues" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "issue_type" TEXT NOT NULL,
    "severity" "LegalGraphIssueSeverity" NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "related_node_id" TEXT,
    "status" "LegalGraphIssueStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "legal_graph_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "KnowledgeDocumentType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_type" "KnowledgeChunkSemanticType" NOT NULL,
    "audience" "KnowledgeChunkAudience" NOT NULL,
    "importance" "KnowledgeChunkImportance" NOT NULL,
    "page_number" INTEGER,
    "embedding" DOUBLE PRECISION[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_drafting_events" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "section_key" TEXT,
    "action_type" "AutoDraftingActionType" NOT NULL,
    "input_payload" JSONB NOT NULL,
    "output_payload" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_drafting_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomous_workflow_tasks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT,
    "property_id" TEXT,
    "task_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "target_user_role" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "AutonomousWorkflowTaskStatus" NOT NULL DEFAULT 'pending',
    "requires_approval" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "autonomous_workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_automation_events" (
    "id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "status" "WorkflowAutomationEventStatus" NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_validation_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" "ModelValidationRunStatus" NOT NULL DEFAULT 'draft',
    "validation_run_kind" "ModelValidationRunKind" NOT NULL DEFAULT 'baseline',
    "applied_tuning_profile_id" TEXT,
    "comparison_target_run_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "model_validation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_run_comparisons" (
    "id" TEXT NOT NULL,
    "base_run_id" TEXT NOT NULL,
    "comparison_run_id" TEXT NOT NULL,
    "metrics_delta" JSONB NOT NULL,
    "summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_run_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_batches" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" "CalibrationBatchStatus" NOT NULL DEFAULT 'draft',
    "source_validation_run_ids" JSONB NOT NULL,
    "active_tuning_profile_id" TEXT,
    "listing_count" INTEGER NOT NULL DEFAULT 0,
    "target_min_items" INTEGER,
    "target_max_items" INTEGER,
    "composition_targets" JSONB,
    "metrics_json" JSONB,
    "drift_summary_json" JSONB,
    "tuning_review_recommended" BOOLEAN,
    "tuning_review_reasons_json" JSONB,
    "tuning_proposed" BOOLEAN,
    "tuning_applied" BOOLEAN,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "calibration_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_batch_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_run_id" TEXT,
    "predicted_trust_score" INTEGER,
    "predicted_trust_confidence" INTEGER,
    "predicted_deal_score" INTEGER,
    "predicted_deal_confidence" INTEGER,
    "predicted_fraud_score" INTEGER,
    "predicted_recommendation" TEXT,
    "predicted_issue_codes" JSONB,
    "human_trust_label" TEXT,
    "human_deal_label" TEXT,
    "human_risk_label" TEXT,
    "fairness_rating" INTEGER,
    "needs_manual_review" BOOLEAN,
    "notes" TEXT,
    "segment_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_drift_alerts" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" "CalibrationDriftSeverity" NOT NULL,
    "metric_name" TEXT,
    "previous_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION,
    "threshold_value" DOUBLE PRECISION,
    "message" TEXT NOT NULL,
    "status" "CalibrationDriftAlertStatus" NOT NULL DEFAULT 'open',
    "segment_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_drift_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads_marketplace" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT,
    "score" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "status" "lead_marketplace_status" NOT NULL DEFAULT 'available',
    "buyer_id" TEXT,
    "purchased_at" TIMESTAMPTZ(6),
    "stripe_session_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "leads_marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_lecipm_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_slug" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_lecipm_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_monetization_profiles" (
    "broker_id" TEXT NOT NULL,
    "lead_price" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "checkout_mode" TEXT NOT NULL DEFAULT 'invoice_batch',
    "max_unpaid_leads" INTEGER NOT NULL DEFAULT 5,
    "lead_receiving_paused" BOOLEAN NOT NULL DEFAULT false,
    "subscription_covers_assigned_leads" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_monetization_profiles_pkey" PRIMARY KEY ("broker_id")
);

-- CreateTable
CREATE TABLE "broker_leads" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "listing_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "billing_status" TEXT NOT NULL DEFAULT 'unpaid',
    "price" DOUBLE PRECISION NOT NULL,
    "broker_invoice_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_invoices" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripe_session_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_payments" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "broker_lead_id" TEXT,
    "broker_invoice_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_key" TEXT NOT NULL,
    "creator_user_id" TEXT,
    "title" TEXT,
    "summary_line" TEXT,
    "trust_score_hint" INTEGER,
    "deal_score_hint" INTEGER,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "public_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_click_events" (
    "id" TEXT NOT NULL,
    "share_link_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "city" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seo_blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'testing',
    "launch_date" TIMESTAMPTZ(6),
    "listings_enabled" BOOLEAN NOT NULL DEFAULT false,
    "search_pages_enabled" BOOLEAN NOT NULL DEFAULT false,
    "growth_engine_enabled" BOOLEAN NOT NULL DEFAULT false,
    "playbook_messaging" TEXT,
    "playbook_pricing" TEXT,
    "playbook_strategy" TEXT,
    "expansion_score" INTEGER,
    "city_match_terms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_page_contents" (
    "id" TEXT NOT NULL,
    "city_slug" TEXT NOT NULL,
    "page_kind" TEXT NOT NULL,
    "block_best_properties" TEXT NOT NULL,
    "block_top_investment" TEXT NOT NULL,
    "block_rent_vs_buy" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seo_page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_validation_items" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "predicted_trust_score" INTEGER,
    "predicted_trust_confidence" INTEGER,
    "predicted_deal_score" INTEGER,
    "predicted_deal_confidence" INTEGER,
    "predicted_fraud_score" INTEGER,
    "predicted_recommendation" TEXT,
    "predicted_issue_codes" JSONB,
    "human_trust_label" TEXT,
    "human_deal_label" TEXT,
    "human_risk_label" TEXT,
    "fairness_rating" INTEGER,
    "would_publish" BOOLEAN,
    "would_contact" BOOLEAN,
    "would_investigate_further" BOOLEAN,
    "needs_manual_review" BOOLEAN,
    "reviewer_notes" TEXT,
    "agreement_trust" BOOLEAN,
    "agreement_deal" BOOLEAN,
    "agreement_risk" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "model_validation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuning_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "based_on_validation_run_id" TEXT,
    "config" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMPTZ(6),
    "applied_by" TEXT,
    "supersedes_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tuning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuning_comparisons" (
    "id" TEXT NOT NULL,
    "tuning_profile_id" TEXT NOT NULL,
    "validation_run_id" TEXT NOT NULL,
    "before_metrics" JSONB NOT NULL,
    "after_metrics" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tuning_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_deal_feed_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "workspace_id" TEXT,
    "generated_for_date" TIMESTAMP(3) NOT NULL,
    "feed_type" TEXT NOT NULL,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_deal_feed_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_deal_feed_items" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "rank_position" INTEGER NOT NULL,
    "feed_bucket" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "trust_score" INTEGER NOT NULL,
    "deal_score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "explanation" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_deal_feed_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feed_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferred_cities" JSONB,
    "preferred_property_types" JSONB,
    "preferred_modes" JSONB,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "strategy_mode" TEXT,
    "risk_tolerance" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feed_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_interactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "interaction_type" "daily_deal_feed_interaction_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "watchlist_id" TEXT,
    "listing_id" TEXT NOT NULL,
    "alert_type" "watchlist_alert_type" NOT NULL,
    "severity" "watchlist_alert_severity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "watchlist_alert_status" NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "watchlist_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "deal_score" INTEGER,
    "trust_score" INTEGER,
    "fraud_score" INTEGER,
    "confidence" INTEGER,
    "recommendation" TEXT,
    "price" INTEGER,
    "listing_status" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_chains" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "case_id" TEXT,
    "status" "negotiation_chain_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "negotiation_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_versions" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "parent_version_id" TEXT,
    "created_by" TEXT NOT NULL,
    "role" "negotiation_version_role" NOT NULL,
    "status" "negotiation_version_status" NOT NULL DEFAULT 'pending',
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_terms" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "deposit_cents" INTEGER,
    "financing_terms" JSONB NOT NULL DEFAULT '{}',
    "commission_terms" JSONB NOT NULL DEFAULT '{}',
    "deadlines" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "negotiation_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_clauses" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "clause_type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "added_in_version" INTEGER NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "negotiation_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_growth_content_plans" (
    "id" TEXT NOT NULL,
    "plan_date" DATE NOT NULL,
    "topic" TEXT NOT NULL,
    "summary" TEXT,
    "plan_json" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_growth_content_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_growth_content_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload_json" JSONB NOT NULL,
    "human_approved_at" TIMESTAMPTZ(6),
    "human_approved_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_growth_content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_growth_performance_snapshots" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagement_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "raw_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_growth_performance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_channels" (
    "id" TEXT NOT NULL,
    "platform" "GrowthMarketingPlatform" NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "oauth_access_token_encrypted" TEXT NOT NULL,
    "oauth_refresh_token_encrypted" TEXT,
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "token_expires_at" TIMESTAMPTZ(6),
    "status" "GrowthMarketingChannelStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketing_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platform" "GrowthMarketingPlatform" NOT NULL,
    "status" "GrowthContentItemStatus" NOT NULL DEFAULT 'DRAFT',
    "draft_payload" JSONB NOT NULL,
    "publish_payload" JSONB,
    "scheduled_for" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "external_post_id" TEXT,
    "marketing_channel_id" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "publish_fingerprint" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_performance_metrics" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "platform" "GrowthMarketingPlatform" NOT NULL,
    "metric_date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_marketing_engine_content" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "topic_key" TEXT,
    "listing_id" TEXT,
    "city_slug" TEXT,
    "scheduled_for" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "external_post_id" TEXT,
    "blog_slug" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "optimization_meta" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_marketing_engine_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_funnel_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_name" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_usage_counters" (
    "user_id" TEXT NOT NULL,
    "simulator_runs" INTEGER NOT NULL DEFAULT 0,
    "ai_drafts" INTEGER NOT NULL DEFAULT 0,
    "reset_period" TEXT NOT NULL DEFAULT 'lifetime',
    "usage_period_key" TEXT,
    "last_return_visit_at" TIMESTAMPTZ(6),
    "activation_completed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "growth_usage_counters_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "lecipm_conversion_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_monthly_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_conversion_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_conversion_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "status" "lecipm_conversion_subscription_status" NOT NULL,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_conversion_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_conversion_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "simulations_used" INTEGER NOT NULL DEFAULT 0,
    "drafts_used" INTEGER NOT NULL DEFAULT 0,
    "negotiation_drafts_used" INTEGER NOT NULL DEFAULT 0,
    "scenario_saves_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_conversion_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_conversion_entitlements" (
    "id" TEXT NOT NULL,
    "plan_code" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "limit_value" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_conversion_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_restricted_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boundary_geo_json" JSONB NOT NULL,
    "policy_notes" TEXT,
    "postal_code" TEXT,
    "region_code" TEXT,
    "policy_action" "BnhubTrustRestrictedZoneAction",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_restricted_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "bnhub_safety_audit_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "actor_user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_safety_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_guest_favorites" (
    "id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_guest_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "bnhub_review_abuse_reports" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_review_abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_services" (
    "id" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BnhubAddonServiceCategory" NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "full_description" TEXT,
    "icon" TEXT,
    "icon_key" TEXT,
    "service_scope" "BnhubServiceScope" NOT NULL DEFAULT 'LISTING_HOSTED',
    "pricing_behavior" "BnhubCatalogPricingBehavior" NOT NULL DEFAULT 'FIXED',
    "default_requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_premium_tier" BOOLEAN NOT NULL DEFAULT false,
    "min_listing_trust_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_listing_services" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT,
    "service_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pricing_type" "BnhubListingServicePricingType" NOT NULL,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_included" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "capacity_limit" INTEGER,
    "advance_notice_hours" INTEGER,
    "availability_rules" JSONB,
    "notes" TEXT,
    "moderation_status" "BnhubListingServiceModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "admin_disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_listing_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_booking_services" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "guest_user_id" TEXT,
    "host_user_id" TEXT,
    "listing_service_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "line_pricing_type" "BnhubListingServicePricingType",
    "unit_price_cents" INTEGER NOT NULL,
    "total_price_cents" INTEGER NOT NULL,
    "service_date" DATE,
    "status" "BnhubBookingServiceLineStatus" NOT NULL DEFAULT 'CONFIRMED',
    "selected_from" "BnhubServiceSelectedFrom" NOT NULL DEFAULT 'BOOKING_FLOW',
    "notes" TEXT,
    "selected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_booking_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_service_requests" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "service_id" TEXT,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT,
    "request_type" "BnhubServiceRequestType" NOT NULL DEFAULT 'SERVICE_REQUEST',
    "message" TEXT NOT NULL,
    "status" "BnhubServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_review_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_service_bundles" (
    "id" TEXT NOT NULL,
    "bundle_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_segment" "BnhubBundleTargetSegment" NOT NULL,
    "pricing_type" "BnhubBundlePricingType" NOT NULL,
    "base_price_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "visibility_scope" "BnhubBundleVisibilityScope" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_service_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_bundle_items" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "default_quantity" INTEGER NOT NULL DEFAULT 1,
    "pricing_override_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_booking_bundles" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "total_price_cents" INTEGER NOT NULL,
    "bundle_status" "BnhubBookingBundleStatus" NOT NULL DEFAULT 'SELECTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_booking_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_concierge_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "listing_id" TEXT,
    "role_context" "BnhubConciergeRoleContext" NOT NULL,
    "session_status" "BnhubConciergeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_mode" "BnhubConciergeAiMode" NOT NULL DEFAULT 'MOCK',
    "summary" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_concierge_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_concierge_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sender_type" "BnhubConciergeSenderType" NOT NULL,
    "sender_id" TEXT,
    "message_text" TEXT NOT NULL,
    "message_type" "BnhubConciergeMessageType" NOT NULL DEFAULT 'TEXT',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_concierge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_membership_plans" (
    "id" TEXT NOT NULL,
    "membership_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience_type" "BnhubMembershipAudienceType" NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_cycle" "BnhubMembershipBillingCycle" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "benefits_json" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_user_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "membership_status" "BnhubUserMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "renewal_mode" "BnhubMembershipRenewalMode" NOT NULL DEFAULT 'MANUAL',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_service_provider_profiles" (
    "id" TEXT NOT NULL,
    "provider_type" "BnhubProviderType" NOT NULL,
    "provider_user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "verification_status" "BnhubProviderVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "service_categories_json" JSONB NOT NULL DEFAULT '[]',
    "coverage_regions_json" JSONB NOT NULL DEFAULT '[]',
    "rating_summary_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_service_provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_service_safety_rules" (
    "id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "service_code" TEXT,
    "category" "BnhubAddonServiceCategory",
    "scope_type" "BnhubHospitalitySafetyScopeType" NOT NULL,
    "scope_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions_json" JSONB NOT NULL DEFAULT '{}',
    "actions_json" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_service_safety_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_service_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "BnhubHospitalityAuditActorType" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_service_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_travel_products" (
    "id" TEXT NOT NULL,
    "product_type" "BnhubTravelProductType" NOT NULL,
    "provider_profile_id" TEXT,
    "external_ref" TEXT,
    "title" TEXT NOT NULL,
    "location_json" JSONB NOT NULL DEFAULT '{}',
    "availability_json" JSONB,
    "pricing_json" JSONB,
    "status" "BnhubTravelProductStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_travel_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_service_discount_rules" (
    "id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applies_to" TEXT NOT NULL,
    "discount_bps" INTEGER NOT NULL DEFAULT 0,
    "conditions_json" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_service_discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_code_sequences_scope_key" ON "platform_code_sequences"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_user_code_key" ON "User"("user_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_verification_token_key" ON "User"("email_verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_lecipm_city_id_idx" ON "User"("lecipm_city_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "ai_actions_user_id_status_idx" ON "ai_actions"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_actions_user_id_created_at_idx" ON "ai_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_actions_context_idx" ON "ai_actions"("context");

-- CreateIndex
CREATE INDEX "ai_actions_workspace_id_idx" ON "ai_actions"("workspace_id");

-- CreateIndex
CREATE INDEX "avatar_profiles_active_idx" ON "avatar_profiles"("active");

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_user_explainer_media_user_id_key" ON "lecipm_user_explainer_media"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_workspaces_slug_key" ON "enterprise_workspaces"("slug");

-- CreateIndex
CREATE INDEX "idx_enterprise_workspaces_created_by" ON "enterprise_workspaces"("created_by_user_id");

-- CreateIndex
CREATE INDEX "idx_enterprise_workspace_member_user" ON "enterprise_workspace_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enterprise_workspace_member" ON "enterprise_workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_enterprise_workspace_invites_ws" ON "enterprise_workspace_invites"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_enterprise_workspace_invites_email" ON "enterprise_workspace_invites"("email");

-- CreateIndex
CREATE INDEX "idx_workspace_audit_ws_created" ON "workspace_audit_logs"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_workspace_audit_actor" ON "workspace_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "idx_deal_history_ws_created" ON "deal_history"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_deal_history_deal" ON "deal_history"("deal_id");

-- CreateIndex
CREATE INDEX "idx_ws_broker_rep_ws" ON "workspace_broker_reputation"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_workspace_broker_reputation" ON "workspace_broker_reputation"("workspace_id", "broker_user_id");

-- CreateIndex
CREATE INDEX "idx_ws_deal_share_ws_deal" ON "workspace_deal_shares"("workspace_id", "deal_id");

-- CreateIndex
CREATE INDEX "idx_ws_deal_share_target" ON "workspace_deal_shares"("target_user_id");

-- CreateIndex
CREATE INDEX "idx_ws_collab_ws_created" ON "workspace_collaboration_messages"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ws_collab_deal" ON "workspace_collaboration_messages"("deal_id");

-- CreateIndex
CREATE INDEX "idx_ws_referral_ws" ON "workspace_referrals"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_ws_referral_email" ON "workspace_referrals"("referred_email");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_user_date" ON "daily_tasks"("user_id", "task_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_daily_tasks_user_date_type" ON "daily_tasks"("user_id", "task_date", "task_type");

-- CreateIndex
CREATE INDEX "idx_daily_metrics_user_date" ON "daily_metrics"("user_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_daily_metrics_user_date" ON "daily_metrics"("user_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "dm_scripts_variant_key" ON "dm_scripts"("variant");

-- CreateIndex
CREATE INDEX "idx_market_snapshots_region_date" ON "market_snapshots"("region_slug", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_market_snapshots_region_window_date" ON "market_snapshots"("region_slug", "property_type", "mode", "analysis_window_days", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_revenue_snapshots_date" ON "revenue_snapshots"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_snapshots_snapshot_date_key" ON "revenue_snapshots"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "growth_email_logs_idempotency_key_key" ON "growth_email_logs"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_growth_email_logs_user_id" ON "growth_email_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_growth_email_logs_trigger_key" ON "growth_email_logs"("trigger_key");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_created_at_idx" ON "saved_searches"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_license_acceptances_user_id_key" ON "content_license_acceptances"("user_id");

-- CreateIndex
CREATE INDEX "content_license_acceptances_user_id_idx" ON "content_license_acceptances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_listings_listing_code_key" ON "rental_listings"("listing_code");

-- CreateIndex
CREATE INDEX "rental_listings_landlord_id_idx" ON "rental_listings"("landlord_id");

-- CreateIndex
CREATE INDEX "rental_listings_status_idx" ON "rental_listings"("status");

-- CreateIndex
CREATE INDEX "rental_applications_listing_id_idx" ON "rental_applications"("listing_id");

-- CreateIndex
CREATE INDEX "rental_applications_tenant_id_idx" ON "rental_applications"("tenant_id");

-- CreateIndex
CREATE INDEX "rental_applications_status_idx" ON "rental_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rental_leases_application_id_key" ON "rental_leases"("application_id");

-- CreateIndex
CREATE INDEX "rental_leases_tenant_id_idx" ON "rental_leases"("tenant_id");

-- CreateIndex
CREATE INDEX "rental_leases_landlord_id_idx" ON "rental_leases"("landlord_id");

-- CreateIndex
CREATE INDEX "rental_leases_listing_id_idx" ON "rental_leases"("listing_id");

-- CreateIndex
CREATE INDEX "rent_payments_lease_id_idx" ON "rent_payments"("lease_id");

-- CreateIndex
CREATE INDEX "rent_payments_due_date_idx" ON "rent_payments"("due_date");

-- CreateIndex
CREATE INDEX "rent_payments_status_idx" ON "rent_payments"("status");

-- CreateIndex
CREATE INDEX "immo_contact_logs_user_id_idx" ON "immo_contact_logs"("user_id");

-- CreateIndex
CREATE INDEX "immo_contact_logs_target_user_id_idx" ON "immo_contact_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "immo_contact_logs_broker_id_idx" ON "immo_contact_logs"("broker_id");

-- CreateIndex
CREATE INDEX "immo_contact_logs_listing_id_idx" ON "immo_contact_logs"("listing_id");

-- CreateIndex
CREATE INDEX "immo_contact_logs_hub_idx" ON "immo_contact_logs"("hub");

-- CreateIndex
CREATE INDEX "immo_contact_logs_contact_type_idx" ON "immo_contact_logs"("contact_type");

-- CreateIndex
CREATE INDEX "immo_contact_logs_created_at_idx" ON "immo_contact_logs"("created_at");

-- CreateIndex
CREATE INDEX "immo_contact_logs_action_at_idx" ON "immo_contact_logs"("action_at");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_experts_user_id_key" ON "mortgage_experts"("user_id");

-- CreateIndex
CREATE INDEX "mortgage_experts_is_active_idx" ON "mortgage_experts"("is_active");

-- CreateIndex
CREATE INDEX "mortgage_experts_accepted_terms_idx" ON "mortgage_experts"("accepted_terms");

-- CreateIndex
CREATE INDEX "mortgage_experts_is_available_idx" ON "mortgage_experts"("is_available");

-- CreateIndex
CREATE INDEX "mortgage_experts_current_leads_today_idx" ON "mortgage_experts"("current_leads_today");

-- CreateIndex
CREATE INDEX "two_factor_codes_user_id_expires_at_idx" ON "two_factor_codes"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "expert_subscriptions_expert_id_key" ON "expert_subscriptions"("expert_id");

-- CreateIndex
CREATE INDEX "expert_subscriptions_plan_idx" ON "expert_subscriptions"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "expert_billing_expert_id_key" ON "expert_billing"("expert_id");

-- CreateIndex
CREATE INDEX "expert_billing_stripe_subscription_id_idx" ON "expert_billing"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "expert_billing_stripe_customer_id_idx" ON "expert_billing"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "expert_invoices_expert_id_created_at_idx" ON "expert_invoices"("expert_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expert_payout_records_mortgage_deal_id_key" ON "expert_payout_records"("mortgage_deal_id");

-- CreateIndex
CREATE INDEX "expert_payout_records_expert_id_idx" ON "expert_payout_records"("expert_id");

-- CreateIndex
CREATE INDEX "expert_payout_records_status_idx" ON "expert_payout_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_expert_reviews_lead_id_key" ON "mortgage_expert_reviews"("lead_id");

-- CreateIndex
CREATE INDEX "mortgage_expert_reviews_expert_id_idx" ON "mortgage_expert_reviews"("expert_id");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_brokers_user_id_key" ON "mortgage_brokers"("user_id");

-- CreateIndex
CREATE INDEX "mortgage_brokers_user_id_idx" ON "mortgage_brokers"("user_id");

-- CreateIndex
CREATE INDEX "mortgage_brokers_plan_idx" ON "mortgage_brokers"("plan");

-- CreateIndex
CREATE INDEX "mortgage_brokers_is_primary_idx" ON "mortgage_brokers"("is_primary");

-- CreateIndex
CREATE INDEX "mortgage_brokers_last_assigned_lead_at_idx" ON "mortgage_brokers"("last_assigned_lead_at");

-- CreateIndex
CREATE INDEX "mortgage_requests_user_id_idx" ON "mortgage_requests"("user_id");

-- CreateIndex
CREATE INDEX "mortgage_requests_broker_id_idx" ON "mortgage_requests"("broker_id");

-- CreateIndex
CREATE INDEX "mortgage_requests_status_created_at_idx" ON "mortgage_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "mortgage_requests_intent_level_idx" ON "mortgage_requests"("intent_level");

-- CreateIndex
CREATE INDEX "mortgage_requests_fsbo_listing_id_idx" ON "mortgage_requests"("fsbo_listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_lead_unlocks_mortgage_request_id_key" ON "mortgage_lead_unlocks"("mortgage_request_id");

-- CreateIndex
CREATE INDEX "mortgage_lead_unlocks_broker_id_created_at_idx" ON "mortgage_lead_unlocks"("broker_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "broker_reviews_mortgage_request_id_key" ON "broker_reviews"("mortgage_request_id");

-- CreateIndex
CREATE INDEX "broker_reviews_broker_id_idx" ON "broker_reviews"("broker_id");

-- CreateIndex
CREATE INDEX "broker_reviews_user_id_idx" ON "broker_reviews"("user_id");

-- CreateIndex
CREATE INDEX "mortgage_lead_distribution_logs_broker_id_idx" ON "mortgage_lead_distribution_logs"("broker_id");

-- CreateIndex
CREATE INDEX "mortgage_lead_distribution_logs_created_at_idx" ON "mortgage_lead_distribution_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_deals_lead_id_key" ON "mortgage_deals"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_deals_review_token_key" ON "mortgage_deals"("review_token");

-- CreateIndex
CREATE INDEX "mortgage_deals_expert_id_idx" ON "mortgage_deals"("expert_id");

-- CreateIndex
CREATE INDEX "mortgage_deals_status_idx" ON "mortgage_deals"("status");

-- CreateIndex
CREATE INDEX "expert_in_app_notifications_expert_id_read_at_idx" ON "expert_in_app_notifications"("expert_id", "read_at");

-- CreateIndex
CREATE INDEX "expert_in_app_notifications_expert_id_created_at_idx" ON "expert_in_app_notifications"("expert_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "fsbo_listings_listing_code_key" ON "fsbo_listings"("listing_code");

-- CreateIndex
CREATE INDEX "fsbo_listings_owner_id_idx" ON "fsbo_listings"("owner_id");

-- CreateIndex
CREATE INDEX "fsbo_listings_tenant_id_idx" ON "fsbo_listings"("tenant_id");

-- CreateIndex
CREATE INDEX "fsbo_listings_city_idx" ON "fsbo_listings"("city");

-- CreateIndex
CREATE INDEX "fsbo_listings_city_status_moderation_status_idx" ON "fsbo_listings"("city", "status", "moderation_status");

-- CreateIndex
CREATE INDEX "fsbo_listings_status_idx" ON "fsbo_listings"("status");

-- CreateIndex
CREATE INDEX "fsbo_listings_moderation_status_idx" ON "fsbo_listings"("moderation_status");

-- CreateIndex
CREATE INDEX "fsbo_listings_price_cents_idx" ON "fsbo_listings"("price_cents");

-- CreateIndex
CREATE INDEX "fsbo_listings_risk_score_idx" ON "fsbo_listings"("risk_score");

-- CreateIndex
CREATE INDEX "idx_fsbo_listings_updated_at_desc" ON "fsbo_listings"("updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "deal_analyses_short_term_listing_id_key" ON "deal_analyses"("short_term_listing_id");

-- CreateIndex
CREATE INDEX "idx_deal_analyses_property_id" ON "deal_analyses"("property_id");

-- CreateIndex
CREATE INDEX "idx_deal_analyses_canonical_property_id" ON "deal_analyses"("canonical_property_id");

-- CreateIndex
CREATE INDEX "idx_deal_analyses_short_term_listing_id" ON "deal_analyses"("short_term_listing_id");

-- CreateIndex
CREATE INDEX "idx_deal_analyses_created_at_desc" ON "deal_analyses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_deal_analysis_factors_analysis_id" ON "deal_analysis_factors"("analysis_id");

-- CreateIndex
CREATE INDEX "idx_deal_analysis_scenarios_analysis_id" ON "deal_analysis_scenarios"("analysis_id");

-- CreateIndex
CREATE INDEX "idx_deal_analysis_comparables_analysis_id" ON "deal_analysis_comparables"("analysis_id");

-- CreateIndex
CREATE INDEX "idx_deal_offer_strategies_property_id" ON "deal_offer_strategies"("property_id");

-- CreateIndex
CREATE INDEX "offer_strategy_scenarios_property_id_idx" ON "offer_strategy_scenarios"("property_id");

-- CreateIndex
CREATE INDEX "offer_strategy_scenarios_case_id_idx" ON "offer_strategy_scenarios"("case_id");

-- CreateIndex
CREATE INDEX "offer_strategy_scenarios_user_id_idx" ON "offer_strategy_scenarios"("user_id");

-- CreateIndex
CREATE INDEX "offer_strategy_scenarios_selected_idx" ON "offer_strategy_scenarios"("selected");

-- CreateIndex
CREATE INDEX "offer_strategy_scenarios_created_at_idx" ON "offer_strategy_scenarios"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_deal_affordability_property_id" ON "deal_affordability_analyses"("property_id");

-- CreateIndex
CREATE INDEX "idx_deal_watchlists_owner_id" ON "deal_watchlists"("owner_id");

-- CreateIndex
CREATE INDEX "idx_deal_watchlist_items_property_id" ON "deal_watchlist_items"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_watchlist_items_watchlist_id_property_id_key" ON "deal_watchlist_items"("watchlist_id", "property_id");

-- CreateIndex
CREATE INDEX "idx_deal_portfolio_alerts_watchlist_id" ON "deal_portfolio_alerts"("watchlist_id");

-- CreateIndex
CREATE INDEX "idx_deal_portfolio_alerts_property_id" ON "deal_portfolio_alerts"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_pricing_advice_property_id_key" ON "seller_pricing_advice"("property_id");

-- CreateIndex
CREATE INDEX "idx_deal_refresh_jobs_property_id" ON "deal_analysis_refresh_jobs"("property_id");

-- CreateIndex
CREATE INDEX "idx_deal_refresh_jobs_status" ON "deal_analysis_refresh_jobs"("status");

-- CreateIndex
CREATE INDEX "idx_deal_refresh_events_property_id" ON "deal_analysis_refresh_events"("property_id");

-- CreateIndex
CREATE INDEX "idx_deal_negotiation_playbooks_property_id" ON "deal_negotiation_playbooks"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_repricing_reviews_property_id_key" ON "seller_repricing_reviews"("property_id");

-- CreateIndex
CREATE INDEX "idx_seller_repricing_triggers_property_id" ON "seller_repricing_triggers"("property_id");

-- CreateIndex
CREATE INDEX "idx_seller_repricing_triggers_status" ON "seller_repricing_triggers"("status");

-- CreateIndex
CREATE INDEX "idx_portfolio_monitoring_snapshots_watchlist_id" ON "portfolio_monitoring_snapshots"("watchlist_id");

-- CreateIndex
CREATE INDEX "idx_portfolio_monitoring_events_watchlist_id" ON "portfolio_monitoring_events"("watchlist_id");

-- CreateIndex
CREATE INDEX "idx_portfolio_monitoring_events_property_id" ON "portfolio_monitoring_events"("property_id");

-- CreateIndex
CREATE INDEX "media_content_fingerprints_sha256_idx" ON "media_content_fingerprints"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "media_content_fingerprints_sha256_fsbo_listing_id_key" ON "media_content_fingerprints"("sha256", "fsbo_listing_id");

-- CreateIndex
CREATE INDEX "listing_ai_scores_property_id_created_at_idx" ON "listing_ai_scores"("property_id", "created_at");

-- CreateIndex
CREATE INDEX "listing_ai_scores_risk_score_idx" ON "listing_ai_scores"("risk_score");

-- CreateIndex
CREATE INDEX "fsbo_listing_documents_fsbo_listing_id_idx" ON "fsbo_listing_documents"("fsbo_listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "fsbo_listing_documents_fsbo_listing_id_doc_type_key" ON "fsbo_listing_documents"("fsbo_listing_id", "doc_type");

-- CreateIndex
CREATE INDEX "seller_documents_user_id_idx" ON "seller_documents"("user_id");

-- CreateIndex
CREATE INDEX "seller_documents_fsbo_listing_id_idx" ON "seller_documents"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "seller_documents_status_idx" ON "seller_documents"("status");

-- CreateIndex
CREATE INDEX "risk_alerts_user_id_idx" ON "risk_alerts"("user_id");

-- CreateIndex
CREATE INDEX "risk_alerts_property_id_idx" ON "risk_alerts"("property_id");

-- CreateIndex
CREATE INDEX "risk_alerts_severity_idx" ON "risk_alerts"("severity");

-- CreateIndex
CREATE INDEX "risk_alerts_created_at_idx" ON "risk_alerts"("created_at");

-- CreateIndex
CREATE INDEX "idx_verification_cases_entity" ON "verification_cases"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_verification_cases_entity_updated" ON "verification_cases"("entity_type", "entity_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_verification_cases_status" ON "verification_cases"("status");

-- CreateIndex
CREATE INDEX "idx_verification_cases_trust_level" ON "verification_cases"("trust_level");

-- CreateIndex
CREATE INDEX "idx_verification_cases_readiness_level" ON "verification_cases"("readiness_level");

-- CreateIndex
CREATE INDEX "idx_verification_cases_assigned_to" ON "verification_cases"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_verification_cases_updated_at" ON "verification_cases"("updated_at");

-- CreateIndex
CREATE INDEX "idx_verification_signals_case_id" ON "verification_signals"("case_id");

-- CreateIndex
CREATE INDEX "idx_verification_signals_signal_code" ON "verification_signals"("signal_code");

-- CreateIndex
CREATE INDEX "idx_verification_signals_category" ON "verification_signals"("category");

-- CreateIndex
CREATE INDEX "idx_verification_signals_severity" ON "verification_signals"("severity");

-- CreateIndex
CREATE INDEX "idx_verification_signals_status" ON "verification_signals"("status");

-- CreateIndex
CREATE INDEX "idx_verification_rule_results_case_id" ON "verification_rule_results"("case_id");

-- CreateIndex
CREATE INDEX "idx_verification_rule_results_rule_code" ON "verification_rule_results"("rule_code");

-- CreateIndex
CREATE INDEX "idx_trust_profiles_subject" ON "trust_profiles"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "idx_trust_profiles_last_case_id" ON "trust_profiles"("last_case_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_trust_profiles_subject" ON "trust_profiles"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "idx_human_review_actions_case_id" ON "human_review_actions"("case_id");

-- CreateIndex
CREATE INDEX "idx_human_review_actions_reviewer_id" ON "human_review_actions"("reviewer_id");

-- CreateIndex
CREATE INDEX "idx_human_review_actions_action_type" ON "human_review_actions"("action_type");

-- CreateIndex
CREATE INDEX "idx_next_best_actions_case_id" ON "next_best_actions"("case_id");

-- CreateIndex
CREATE INDEX "idx_next_best_actions_status" ON "next_best_actions"("status");

-- CreateIndex
CREATE INDEX "idx_next_best_actions_priority" ON "next_best_actions"("priority");

-- CreateIndex
CREATE INDEX "idx_next_best_actions_actor_type" ON "next_best_actions"("actor_type");

-- CreateIndex
CREATE INDEX "idx_media_verification_jobs_listing_id" ON "media_verification_jobs"("listing_id");

-- CreateIndex
CREATE INDEX "idx_media_verification_jobs_case_id" ON "media_verification_jobs"("case_id");

-- CreateIndex
CREATE INDEX "idx_media_verification_jobs_status" ON "media_verification_jobs"("job_status");

-- CreateIndex
CREATE INDEX "idx_media_verification_jobs_media_type" ON "media_verification_jobs"("media_type");

-- CreateIndex
CREATE INDEX "idx_tg_extraction_source" ON "trustgraph_extraction_jobs"("source_kind", "source_id");

-- CreateIndex
CREATE INDEX "idx_tg_extraction_listing" ON "trustgraph_extraction_jobs"("fsbo_listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "trustgraph_extracted_document_records_job_id_key" ON "trustgraph_extracted_document_records"("job_id");

-- CreateIndex
CREATE INDEX "idx_tg_extracted_fields_record" ON "trustgraph_extracted_document_fields"("record_id");

-- CreateIndex
CREATE INDEX "idx_tg_extraction_reviews_record" ON "trustgraph_extraction_review_actions"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_fraud_graph_node_kind_ext" ON "fraud_graph_nodes"("kind", "external_id");

-- CreateIndex
CREATE INDEX "idx_fraud_edge_from" ON "fraud_graph_edges"("from_node_id");

-- CreateIndex
CREATE INDEX "idx_fraud_edge_to" ON "fraud_graph_edges"("to_node_id");

-- CreateIndex
CREATE INDEX "idx_fraud_graph_events_type" ON "fraud_graph_events"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "trustgraph_geospatial_validations_fsbo_listing_id_key" ON "trustgraph_geospatial_validations"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "idx_tg_workspace_org" ON "trustgraph_compliance_workspaces"("org_type", "org_id");

-- CreateIndex
CREATE INDEX "idx_tg_workspace_member_user" ON "trustgraph_compliance_workspace_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tg_workspace_member" ON "trustgraph_compliance_workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_tg_ws_entity_workspace" ON "trustgraph_compliance_workspace_entity_links"("workspace_id", "entity_type");

-- CreateIndex
CREATE INDEX "idx_tg_ws_entity_lookup" ON "trustgraph_compliance_workspace_entity_links"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_tg_ws_case_assignment_case" ON "trustgraph_workspace_case_assignments"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tg_ws_case_assignment" ON "trustgraph_workspace_case_assignments"("workspace_id", "case_id");

-- CreateIndex
CREATE INDEX "idx_tg_doc_approval_entity" ON "trustgraph_document_approval_flows"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_tg_doc_approval_workspace" ON "trustgraph_document_approval_flows"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_tg_doc_approval_steps_flow" ON "trustgraph_document_approval_steps"("approval_flow_id");

-- CreateIndex
CREATE INDEX "idx_tg_doc_approval_actions_flow" ON "trustgraph_document_approval_actions"("approval_flow_id");

-- CreateIndex
CREATE INDEX "idx_tg_doc_approval_actions_step" ON "trustgraph_document_approval_actions"("step_id");

-- CreateIndex
CREATE INDEX "idx_tg_sla_policy_ws_queue" ON "trustgraph_sla_policies"("workspace_id", "queue_key");

-- CreateIndex
CREATE INDEX "idx_tg_sla_events_case" ON "trustgraph_sla_events"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "trustgraph_case_sla_states_case_id_key" ON "trustgraph_case_sla_states"("case_id");

-- CreateIndex
CREATE INDEX "idx_tg_case_sla_ws" ON "trustgraph_case_sla_states"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_tg_subscription_workspace" ON "trustgraph_subscriptions"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_tg_usage_ws_type" ON "trustgraph_usage_records"("workspace_id", "usage_type");

-- CreateIndex
CREATE INDEX "idx_tg_usage_recorded" ON "trustgraph_usage_records"("recorded_at");

-- CreateIndex
CREATE INDEX "idx_tg_billing_ws" ON "trustgraph_billing_events"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_tg_partner_key_hash" ON "trustgraph_partner_api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "idx_tg_partner_key_ws" ON "trustgraph_partner_api_keys"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_tg_recert_subject" ON "trustgraph_recertification_jobs"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "idx_tg_recert_next" ON "trustgraph_recertification_jobs"("next_run_at");

-- CreateIndex
CREATE INDEX "idx_tg_recert_rule_ruleset" ON "trustgraph_recertification_rules"("ruleset_key");

-- CreateIndex
CREATE INDEX "idx_tg_recert_events_job" ON "trustgraph_recertification_events"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "trustgraph_compliance_rulesets_code_key" ON "trustgraph_compliance_rulesets"("code");

-- CreateIndex
CREATE INDEX "idx_tg_audit_ws" ON "trustgraph_audit_packages"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_entity_verification_links_case_id" ON "entity_verification_links"("case_id");

-- CreateIndex
CREATE INDEX "idx_entity_verification_links_entity" ON "entity_verification_links"("linked_entity_type", "linked_entity_id");

-- CreateIndex
CREATE INDEX "idx_entity_verification_links_relation_type" ON "entity_verification_links"("relation_type");

-- CreateIndex
CREATE UNIQUE INDEX "fsbo_listing_verifications_fsbo_listing_id_key" ON "fsbo_listing_verifications"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "fsbo_leads_listing_id_idx" ON "fsbo_leads"("listing_id");

-- CreateIndex
CREATE INDEX "fsbo_leads_tenant_id_idx" ON "fsbo_leads"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_requests_broker_client_id_key" ON "buyer_requests"("broker_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_requests_conversation_id_key" ON "buyer_requests"("conversation_id");

-- CreateIndex
CREATE INDEX "buyer_requests_fsbo_listing_id_idx" ON "buyer_requests"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "buyer_requests_assigned_broker_id_idx" ON "buyer_requests"("assigned_broker_id");

-- CreateIndex
CREATE INDEX "buyer_requests_user_id_idx" ON "buyer_requests"("user_id");

-- CreateIndex
CREATE INDEX "buyer_requests_tenant_id_idx" ON "buyer_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "advisory_access_user_id_idx" ON "advisory_access"("user_id");

-- CreateIndex
CREATE INDEX "advisory_access_status_idx" ON "advisory_access"("status");

-- CreateIndex
CREATE INDEX "buyer_listing_views_fsbo_listing_id_created_at_idx" ON "buyer_listing_views"("fsbo_listing_id", "created_at");

-- CreateIndex
CREATE INDEX "buyer_listing_views_user_id_idx" ON "buyer_listing_views"("user_id");

-- CreateIndex
CREATE INDEX "buyer_saved_listings_user_id_idx" ON "buyer_saved_listings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_saved_listings_user_id_fsbo_listing_id_key" ON "buyer_saved_listings"("user_id", "fsbo_listing_id");

-- CreateIndex
CREATE INDEX "idx_properties_owner_id" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "idx_properties_created_at_desc" ON "Property"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_property_media_property_id" ON "property_media"("property_id");

-- CreateIndex
CREATE INDEX "bnhub_hosts_status_idx" ON "bnhub_hosts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_hosts_user_id_key" ON "bnhub_hosts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_ads_daily_rollups_date_key" ON "bnhub_ads_daily_rollups"("date");

-- CreateIndex
CREATE INDEX "bnhub_ads_daily_rollups_date_idx" ON "bnhub_ads_daily_rollups"("date");

-- CreateIndex
CREATE INDEX "bnhub_host_pipeline_entries_status_idx" ON "bnhub_host_pipeline_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_investor_contacts_email_key" ON "bnhub_investor_contacts"("email");

-- CreateIndex
CREATE INDEX "bnhub_investor_contacts_status_idx" ON "bnhub_investor_contacts"("status");

-- CreateIndex
CREATE INDEX "bnhub_investor_contacts_organization_idx" ON "bnhub_investor_contacts"("organization");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_promotion_plans_sku_key" ON "bnhub_promotion_plans"("sku");

-- CreateIndex
CREATE INDEX "bnhub_promotion_plans_placement_idx" ON "bnhub_promotion_plans"("placement");

-- CreateIndex
CREATE INDEX "bnhub_promotion_plans_active_idx" ON "bnhub_promotion_plans"("active");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_plan_id_idx" ON "bnhub_promotion_orders"("plan_id");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_payer_user_id_idx" ON "bnhub_promotion_orders"("payer_user_id");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_status_idx" ON "bnhub_promotion_orders"("status");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_end_at_idx" ON "bnhub_promotion_orders"("end_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_sales_assist_entries_converted_booking_id_key" ON "bnhub_sales_assist_entries"("converted_booking_id");

-- CreateIndex
CREATE INDEX "bnhub_sales_assist_entries_stage_idx" ON "bnhub_sales_assist_entries"("stage");

-- CreateIndex
CREATE INDEX "bnhub_sales_assist_entries_next_follow_up_at_idx" ON "bnhub_sales_assist_entries"("next_follow_up_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_automation_events_dedupe_key_key" ON "bnhub_automation_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "bnhub_automation_events_user_id_idx" ON "bnhub_automation_events"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_automation_events_trigger_idx" ON "bnhub_automation_events"("trigger");

-- CreateIndex
CREATE INDEX "bnhub_automation_events_created_at_idx" ON "bnhub_automation_events"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_host_agreements_host_id_idx" ON "bnhub_host_agreements"("host_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_host_agreements_host_id_key" ON "bnhub_host_agreements"("host_id");

-- CreateIndex
CREATE INDEX "bnhub_host_listings_host_id_idx" ON "bnhub_host_listings"("host_id");

-- CreateIndex
CREATE INDEX "hotel_hub_hotels_location_idx" ON "hotel_hub_hotels"("location");

-- CreateIndex
CREATE INDEX "hotel_hub_rooms_hotel_id_idx" ON "hotel_hub_rooms"("hotel_id");

-- CreateIndex
CREATE INDEX "hotel_hub_bookings_room_id_idx" ON "hotel_hub_bookings"("room_id");

-- CreateIndex
CREATE INDEX "hotel_hub_bookings_check_in_idx" ON "hotel_hub_bookings"("check_in");

-- CreateIndex
CREATE INDEX "travel_packages_location_idx" ON "travel_packages"("location");

-- CreateIndex
CREATE INDEX "travel_package_bookings_package_id_idx" ON "travel_package_bookings"("package_id");

-- CreateIndex
CREATE INDEX "travel_package_bookings_start_date_idx" ON "travel_package_bookings"("start_date");

-- CreateIndex
CREATE INDEX "shared_bookings_listing_id_idx" ON "shared_bookings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_listings_listing_code_key" ON "bnhub_listings"("listing_code");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_listings_channel_ical_export_token_key" ON "bnhub_listings"("channel_ical_export_token");

-- CreateIndex
CREATE INDEX "bnhub_listings_city_verificationStatus_idx" ON "bnhub_listings"("city", "verificationStatus");

-- CreateIndex
CREATE INDEX "bnhub_listings_city_listingStatus_idx" ON "bnhub_listings"("city", "listingStatus");

-- CreateIndex
CREATE INDEX "bnhub_listings_nightPriceCents_idx" ON "bnhub_listings"("nightPriceCents");

-- CreateIndex
CREATE INDEX "bnhub_listings_created_at_idx" ON "bnhub_listings"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_listings_property_identity_id_idx" ON "bnhub_listings"("property_identity_id");

-- CreateIndex
CREATE INDEX "bnhub_listings_host_id_idx" ON "bnhub_listings"("host_id");

-- CreateIndex
CREATE INDEX "bnhub_listings_verificationStatus_idx" ON "bnhub_listings"("verificationStatus");

-- CreateIndex
CREATE INDEX "bnhub_listings_listingStatus_idx" ON "bnhub_listings"("listingStatus");

-- CreateIndex
CREATE INDEX "bnhub_listings_listingVerificationStatus_idx" ON "bnhub_listings"("listingVerificationStatus");

-- CreateIndex
CREATE INDEX "bnhub_listings_cadastreNumber_idx" ON "bnhub_listings"("cadastreNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_property_classification_listing_id_key" ON "bnhub_property_classification"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_property_classification_listing_id_idx" ON "bnhub_property_classification"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_engine_audit_logs_listing_id_idx" ON "bnhub_engine_audit_logs"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_engine_audit_logs_host_user_id_idx" ON "bnhub_engine_audit_logs"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_engine_audit_logs_decision_type_idx" ON "bnhub_engine_audit_logs"("decision_type");

-- CreateIndex
CREATE INDEX "bnhub_engine_audit_logs_created_at_idx" ON "bnhub_engine_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_luxury_tiers_listing_id_key" ON "bnhub_luxury_tiers"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_luxury_tiers_listing_id_idx" ON "bnhub_luxury_tiers"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_luxury_tiers_tier_code_idx" ON "bnhub_luxury_tiers"("tier_code");

-- CreateIndex
CREATE INDEX "bnhub_luxury_tiers_eligibility_status_idx" ON "bnhub_luxury_tiers"("eligibility_status");

-- CreateIndex
CREATE INDEX "bnhub_luxury_tiers_computed_at_idx" ON "bnhub_luxury_tiers"("computed_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_trust_profiles_listing_id_key" ON "bnhub_trust_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_trust_profiles_listing_id_idx" ON "bnhub_trust_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_trust_profiles_host_user_id_idx" ON "bnhub_trust_profiles"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_trust_profiles_overall_risk_level_idx" ON "bnhub_trust_profiles"("overall_risk_level");

-- CreateIndex
CREATE INDEX "bnhub_trust_profiles_status_idx" ON "bnhub_trust_profiles"("status");

-- CreateIndex
CREATE INDEX "bnhub_trust_profiles_computed_at_idx" ON "bnhub_trust_profiles"("computed_at");

-- CreateIndex
CREATE INDEX "bnhub_fraud_flags_listing_id_idx" ON "bnhub_fraud_flags"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_fraud_flags_host_user_id_idx" ON "bnhub_fraud_flags"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_fraud_flags_flag_type_idx" ON "bnhub_fraud_flags"("flag_type");

-- CreateIndex
CREATE INDEX "bnhub_fraud_flags_severity_idx" ON "bnhub_fraud_flags"("severity");

-- CreateIndex
CREATE INDEX "bnhub_fraud_flags_status_idx" ON "bnhub_fraud_flags"("status");

-- CreateIndex
CREATE INDEX "bnhub_fraud_flags_created_at_idx" ON "bnhub_fraud_flags"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_identity_verifications_user_id_idx" ON "bnhub_identity_verifications"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_identity_verifications_verification_status_idx" ON "bnhub_identity_verifications"("verification_status");

-- CreateIndex
CREATE INDEX "bnhub_identity_verifications_provider_idx" ON "bnhub_identity_verifications"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_address_verifications_listing_id_key" ON "bnhub_address_verifications"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_address_verifications_listing_id_idx" ON "bnhub_address_verifications"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_address_verifications_geocode_status_idx" ON "bnhub_address_verifications"("geocode_status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_media_validations_listing_id_key" ON "bnhub_media_validations"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_media_validations_listing_id_idx" ON "bnhub_media_validations"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_listing_risk_profiles_listing_id_key" ON "bnhub_listing_risk_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_risk_profiles_listing_id_idx" ON "bnhub_listing_risk_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_risk_profiles_host_user_id_idx" ON "bnhub_listing_risk_profiles"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_risk_profiles_overall_risk_level_idx" ON "bnhub_listing_risk_profiles"("overall_risk_level");

-- CreateIndex
CREATE INDEX "bnhub_listing_risk_profiles_trust_status_idx" ON "bnhub_listing_risk_profiles"("trust_status");

-- CreateIndex
CREATE INDEX "bnhub_risk_flags_listing_id_idx" ON "bnhub_risk_flags"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_risk_flags_user_id_idx" ON "bnhub_risk_flags"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_risk_flags_reservation_id_idx" ON "bnhub_risk_flags"("reservation_id");

-- CreateIndex
CREATE INDEX "bnhub_risk_flags_flag_type_idx" ON "bnhub_risk_flags"("flag_type");

-- CreateIndex
CREATE INDEX "bnhub_risk_flags_flag_status_idx" ON "bnhub_risk_flags"("flag_status");

-- CreateIndex
CREATE INDEX "bnhub_risk_flags_severity_idx" ON "bnhub_risk_flags"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_location_policy_profiles_listing_id_key" ON "bnhub_location_policy_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_location_policy_profiles_listing_id_idx" ON "bnhub_location_policy_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_location_policy_profiles_policy_status_idx" ON "bnhub_location_policy_profiles"("policy_status");

-- CreateIndex
CREATE INDEX "bnhub_identity_audit_logs_entity_type_entity_id_idx" ON "bnhub_identity_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "bnhub_identity_audit_logs_actor_type_idx" ON "bnhub_identity_audit_logs"("actor_type");

-- CreateIndex
CREATE INDEX "bnhub_identity_audit_logs_created_at_idx" ON "bnhub_identity_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_dynamic_pricing_profiles_listing_id_key" ON "bnhub_dynamic_pricing_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_dynamic_pricing_profiles_listing_id_idx" ON "bnhub_dynamic_pricing_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_dynamic_pricing_profiles_computed_at_idx" ON "bnhub_dynamic_pricing_profiles"("computed_at");

-- CreateIndex
CREATE INDEX "bnhub_pricing_rules_scope_type_scope_id_idx" ON "bnhub_pricing_rules"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "bnhub_pricing_rules_is_enabled_idx" ON "bnhub_pricing_rules"("is_enabled");

-- CreateIndex
CREATE INDEX "bnhub_pricing_rules_rule_type_idx" ON "bnhub_pricing_rules"("rule_type");

-- CreateIndex
CREATE INDEX "bnhub_pricing_rules_priority_idx" ON "bnhub_pricing_rules"("priority");

-- CreateIndex
CREATE INDEX "bnhub_pricing_history_listing_id_idx" ON "bnhub_pricing_history"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_pricing_history_created_at_idx" ON "bnhub_pricing_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_host_quality_profiles_host_user_id_key" ON "bnhub_host_quality_profiles"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_host_quality_profiles_host_user_id_idx" ON "bnhub_host_quality_profiles"("host_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_disclosures_listing_id_key" ON "seller_disclosures"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_draft_templates_slug_key" ON "contract_draft_templates"("slug");

-- CreateIndex
CREATE INDEX "contract_draft_templates_contract_type_idx" ON "contract_draft_templates"("contract_type");

-- CreateIndex
CREATE INDEX "contract_draft_templates_is_active_idx" ON "contract_draft_templates"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "listing_template_answers_listing_id_key" ON "listing_template_answers"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_compliance_reviews_listing_id_key" ON "listing_compliance_reviews"("listing_id");

-- CreateIndex
CREATE INDEX "listing_compliance_reviews_status_idx" ON "listing_compliance_reviews"("status");

-- CreateIndex
CREATE INDEX "broker_applications_user_id_idx" ON "broker_applications"("user_id");

-- CreateIndex
CREATE INDEX "broker_applications_status_idx" ON "broker_applications"("status");

-- CreateIndex
CREATE INDEX "host_applications_user_id_idx" ON "host_applications"("user_id");

-- CreateIndex
CREATE INDEX "host_applications_status_idx" ON "host_applications"("status");

-- CreateIndex
CREATE INDEX "developer_applications_user_id_idx" ON "developer_applications"("user_id");

-- CreateIndex
CREATE INDEX "developer_applications_status_idx" ON "developer_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "property_disclosures_listing_id_key" ON "property_disclosures"("listing_id");

-- CreateIndex
CREATE INDEX "BnhubListingPhoto_listingId_idx" ON "BnhubListingPhoto"("listingId");

-- CreateIndex
CREATE INDEX "ListingVerificationLog_listingId_idx" ON "ListingVerificationLog"("listingId");

-- CreateIndex
CREATE INDEX "property_documents_listing_id_idx" ON "property_documents"("listing_id");

-- CreateIndex
CREATE INDEX "property_documents_document_type_idx" ON "property_documents"("document_type");

-- CreateIndex
CREATE UNIQUE INDEX "document_extractions_document_id_key" ON "document_extractions"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_matches_listing_id_key" ON "verification_matches"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_matches_document_extraction_id_key" ON "verification_matches"("document_extraction_id");

-- CreateIndex
CREATE INDEX "verification_matches_overall_status_idx" ON "verification_matches"("overall_status");

-- CreateIndex
CREATE INDEX "verification_fraud_alerts_listing_id_idx" ON "verification_fraud_alerts"("listing_id");

-- CreateIndex
CREATE INDEX "verification_fraud_alerts_alert_type_idx" ON "verification_fraud_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "property_fraud_scores_risk_level_idx" ON "property_fraud_scores"("risk_level");

-- CreateIndex
CREATE INDEX "property_fraud_scores_fraud_score_idx" ON "property_fraud_scores"("fraud_score");

-- CreateIndex
CREATE UNIQUE INDEX "property_fraud_scores_listing_id_key" ON "property_fraud_scores"("listing_id");

-- CreateIndex
CREATE INDEX "property_fraud_alerts_listing_id_idx" ON "property_fraud_alerts"("listing_id");

-- CreateIndex
CREATE INDEX "property_fraud_alerts_alert_type_idx" ON "property_fraud_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "property_fraud_alerts_status_idx" ON "property_fraud_alerts"("status");

-- CreateIndex
CREATE INDEX "fraud_checks_listing_id_idx" ON "fraud_checks"("listing_id");

-- CreateIndex
CREATE INDEX "fraud_checks_check_type_idx" ON "fraud_checks"("check_type");

-- CreateIndex
CREATE INDEX "fraud_checks_result_idx" ON "fraud_checks"("result");

-- CreateIndex
CREATE INDEX "trust_scores_entity_type_entity_id_idx" ON "trust_scores"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "trust_scores_created_at_idx" ON "trust_scores"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_booking_agreements_booking_id_idx" ON "bnhub_booking_agreements"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_host_profiles_user_id_key" ON "bnhub_host_profiles"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_host_profiles_trust_score_idx" ON "bnhub_host_profiles"("trust_score");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_guest_profiles_user_id_key" ON "bnhub_guest_profiles"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_guest_profiles_trust_score_idx" ON "bnhub_guest_profiles"("trust_score");

-- CreateIndex
CREATE UNIQUE INDEX "broker_activity_scores_broker_id_key" ON "broker_activity_scores"("broker_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_identities_property_uid_key" ON "property_identities"("property_uid");

-- CreateIndex
CREATE INDEX "property_identities_cadastre_number_idx" ON "property_identities"("cadastre_number");

-- CreateIndex
CREATE INDEX "property_identities_normalized_address_idx" ON "property_identities"("normalized_address");

-- CreateIndex
CREATE INDEX "property_identities_municipality_province_idx" ON "property_identities"("municipality", "province");

-- CreateIndex
CREATE INDEX "property_identities_market_region_id_idx" ON "property_identities"("market_region_id");

-- CreateIndex
CREATE INDEX "real_estate_transactions_property_identity_id_idx" ON "real_estate_transactions"("property_identity_id");

-- CreateIndex
CREATE INDEX "real_estate_transactions_buyer_id_idx" ON "real_estate_transactions"("buyer_id");

-- CreateIndex
CREATE INDEX "real_estate_transactions_seller_id_idx" ON "real_estate_transactions"("seller_id");

-- CreateIndex
CREATE INDEX "real_estate_transactions_broker_id_idx" ON "real_estate_transactions"("broker_id");

-- CreateIndex
CREATE INDEX "real_estate_transactions_status_idx" ON "real_estate_transactions"("status");

-- CreateIndex
CREATE INDEX "property_offers_transaction_id_idx" ON "property_offers"("transaction_id");

-- CreateIndex
CREATE INDEX "property_offers_buyer_id_idx" ON "property_offers"("buyer_id");

-- CreateIndex
CREATE INDEX "property_offers_status_idx" ON "property_offers"("status");

-- CreateIndex
CREATE INDEX "property_counter_offers_offer_id_idx" ON "property_counter_offers"("offer_id");

-- CreateIndex
CREATE INDEX "transaction_messages_transaction_id_idx" ON "transaction_messages"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_messages_sender_id_idx" ON "transaction_messages"("sender_id");

-- CreateIndex
CREATE INDEX "transaction_deposits_transaction_id_idx" ON "transaction_deposits"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_deposits_payment_status_idx" ON "transaction_deposits"("payment_status");

-- CreateIndex
CREATE INDEX "transaction_documents_transaction_id_idx" ON "transaction_documents"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_documents_document_type_idx" ON "transaction_documents"("document_type");

-- CreateIndex
CREATE INDEX "transaction_steps_transaction_id_idx" ON "transaction_steps"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_events_transaction_id_idx" ON "transaction_events"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_events_event_type_idx" ON "transaction_events"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_timelines_transaction_id_key" ON "transaction_timelines"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_timelines_current_stage_idx" ON "transaction_timelines"("current_stage");

-- CreateIndex
CREATE INDEX "transaction_timelines_status_idx" ON "transaction_timelines"("status");

-- CreateIndex
CREATE INDEX "transaction_timelines_buyer_id_idx" ON "transaction_timelines"("buyer_id");

-- CreateIndex
CREATE INDEX "transaction_timelines_seller_id_idx" ON "transaction_timelines"("seller_id");

-- CreateIndex
CREATE INDEX "transaction_timelines_broker_id_idx" ON "transaction_timelines"("broker_id");

-- CreateIndex
CREATE INDEX "transaction_timeline_steps_timeline_id_idx" ON "transaction_timeline_steps"("timeline_id");

-- CreateIndex
CREATE INDEX "transaction_timeline_steps_status_idx" ON "transaction_timeline_steps"("status");

-- CreateIndex
CREATE INDEX "transaction_timeline_steps_due_date_idx" ON "transaction_timeline_steps"("due_date");

-- CreateIndex
CREATE INDEX "transaction_timeline_steps_assigned_to_role_idx" ON "transaction_timeline_steps"("assigned_to_role");

-- CreateIndex
CREATE INDEX "transaction_timeline_events_timeline_id_idx" ON "transaction_timeline_events"("timeline_id");

-- CreateIndex
CREATE INDEX "transaction_timeline_events_event_type_idx" ON "transaction_timeline_events"("event_type");

-- CreateIndex
CREATE INDEX "transaction_timeline_events_created_at_idx" ON "transaction_timeline_events"("created_at");

-- CreateIndex
CREATE INDEX "property_identity_links_property_identity_id_idx" ON "property_identity_links"("property_identity_id");

-- CreateIndex
CREATE INDEX "property_identity_links_link_status_idx" ON "property_identity_links"("link_status");

-- CreateIndex
CREATE UNIQUE INDEX "property_identity_links_listing_id_listing_type_key" ON "property_identity_links"("listing_id", "listing_type");

-- CreateIndex
CREATE INDEX "property_identity_verifications_property_identity_id_idx" ON "property_identity_verifications"("property_identity_id");

-- CreateIndex
CREATE INDEX "property_identity_verifications_verification_type_idx" ON "property_identity_verifications"("verification_type");

-- CreateIndex
CREATE INDEX "property_identity_owners_property_identity_id_idx" ON "property_identity_owners"("property_identity_id");

-- CreateIndex
CREATE INDEX "property_identity_risk_property_identity_id_idx" ON "property_identity_risk"("property_identity_id");

-- CreateIndex
CREATE INDEX "property_identity_risk_risk_level_idx" ON "property_identity_risk"("risk_level");

-- CreateIndex
CREATE INDEX "property_identity_events_property_identity_id_idx" ON "property_identity_events"("property_identity_id");

-- CreateIndex
CREATE INDEX "property_identity_events_event_type_idx" ON "property_identity_events"("event_type");

-- CreateIndex
CREATE INDEX "owner_identities_normalized_name_idx" ON "owner_identities"("normalized_name");

-- CreateIndex
CREATE INDEX "owner_identities_verification_status_idx" ON "owner_identities"("verification_status");

-- CreateIndex
CREATE INDEX "broker_identities_license_number_idx" ON "broker_identities"("license_number");

-- CreateIndex
CREATE INDEX "broker_identities_normalized_name_idx" ON "broker_identities"("normalized_name");

-- CreateIndex
CREATE INDEX "organization_identities_normalized_name_idx" ON "organization_identities"("normalized_name");

-- CreateIndex
CREATE INDEX "listing_authorities_property_identity_id_idx" ON "listing_authorities"("property_identity_id");

-- CreateIndex
CREATE INDEX "listing_authorities_owner_identity_id_idx" ON "listing_authorities"("owner_identity_id");

-- CreateIndex
CREATE INDEX "listing_authorities_broker_identity_id_idx" ON "listing_authorities"("broker_identity_id");

-- CreateIndex
CREATE INDEX "listing_authorities_status_idx" ON "listing_authorities"("status");

-- CreateIndex
CREATE INDEX "identity_links_user_id_idx" ON "identity_links"("user_id");

-- CreateIndex
CREATE INDEX "identity_links_identity_type_identity_id_idx" ON "identity_links"("identity_type", "identity_id");

-- CreateIndex
CREATE UNIQUE INDEX "identity_links_identity_type_identity_id_user_id_key" ON "identity_links"("identity_type", "identity_id", "user_id");

-- CreateIndex
CREATE INDEX "ownership_history_property_identity_id_idx" ON "ownership_history"("property_identity_id");

-- CreateIndex
CREATE INDEX "ownership_history_owner_identity_id_idx" ON "ownership_history"("owner_identity_id");

-- CreateIndex
CREATE INDEX "broker_authorization_history_property_identity_id_idx" ON "broker_authorization_history"("property_identity_id");

-- CreateIndex
CREATE INDEX "broker_authorization_history_broker_identity_id_idx" ON "broker_authorization_history"("broker_identity_id");

-- CreateIndex
CREATE INDEX "broker_authorization_history_owner_identity_id_idx" ON "broker_authorization_history"("owner_identity_id");

-- CreateIndex
CREATE INDEX "identity_risk_profiles_identity_type_idx" ON "identity_risk_profiles"("identity_type");

-- CreateIndex
CREATE INDEX "identity_risk_profiles_risk_level_idx" ON "identity_risk_profiles"("risk_level");

-- CreateIndex
CREATE UNIQUE INDEX "identity_risk_profiles_identity_type_identity_id_key" ON "identity_risk_profiles"("identity_type", "identity_id");

-- CreateIndex
CREATE INDEX "identity_events_identity_type_identity_id_idx" ON "identity_events"("identity_type", "identity_id");

-- CreateIndex
CREATE INDEX "identity_events_event_type_idx" ON "identity_events"("event_type");

-- CreateIndex
CREATE INDEX "property_valuations_property_identity_id_idx" ON "property_valuations"("property_identity_id");

-- CreateIndex
CREATE INDEX "property_valuations_listing_id_idx" ON "property_valuations"("listing_id");

-- CreateIndex
CREATE INDEX "property_valuations_valuation_type_idx" ON "property_valuations"("valuation_type");

-- CreateIndex
CREATE INDEX "property_valuations_confidence_label_idx" ON "property_valuations"("confidence_label");

-- CreateIndex
CREATE UNIQUE INDEX "markets_slug_key" ON "markets"("slug");

-- CreateIndex
CREATE INDEX "markets_province_country_idx" ON "markets"("province", "country");

-- CreateIndex
CREATE INDEX "markets_slug_idx" ON "markets"("slug");

-- CreateIndex
CREATE INDEX "property_graph_edges_from_entity_type_from_entity_id_idx" ON "property_graph_edges"("from_entity_type", "from_entity_id");

-- CreateIndex
CREATE INDEX "property_graph_edges_to_entity_type_to_entity_id_idx" ON "property_graph_edges"("to_entity_type", "to_entity_id");

-- CreateIndex
CREATE INDEX "property_graph_edges_edge_type_idx" ON "property_graph_edges"("edge_type");

-- CreateIndex
CREATE INDEX "market_regions_region_type_idx" ON "market_regions"("region_type");

-- CreateIndex
CREATE INDEX "market_regions_parent_region_id_idx" ON "market_regions"("parent_region_id");

-- CreateIndex
CREATE INDEX "market_regions_country_province_idx" ON "market_regions"("country", "province");

-- CreateIndex
CREATE INDEX "market_price_index_market_region_id_idx" ON "market_price_index"("market_region_id");

-- CreateIndex
CREATE INDEX "market_price_index_period_idx" ON "market_price_index"("period");

-- CreateIndex
CREATE UNIQUE INDEX "market_price_index_market_region_id_period_key" ON "market_price_index"("market_region_id", "period");

-- CreateIndex
CREATE INDEX "market_rent_index_market_region_id_idx" ON "market_rent_index"("market_region_id");

-- CreateIndex
CREATE INDEX "market_rent_index_period_idx" ON "market_rent_index"("period");

-- CreateIndex
CREATE UNIQUE INDEX "market_rent_index_market_region_id_period_key" ON "market_rent_index"("market_region_id", "period");

-- CreateIndex
CREATE INDEX "market_bnhub_index_market_region_id_idx" ON "market_bnhub_index"("market_region_id");

-- CreateIndex
CREATE INDEX "market_bnhub_index_period_idx" ON "market_bnhub_index"("period");

-- CreateIndex
CREATE UNIQUE INDEX "market_bnhub_index_market_region_id_period_key" ON "market_bnhub_index"("market_region_id", "period");

-- CreateIndex
CREATE INDEX "market_demand_metrics_market_region_id_idx" ON "market_demand_metrics"("market_region_id");

-- CreateIndex
CREATE INDEX "market_demand_metrics_period_idx" ON "market_demand_metrics"("period");

-- CreateIndex
CREATE UNIQUE INDEX "market_demand_metrics_market_region_id_period_key" ON "market_demand_metrics"("market_region_id", "period");

-- CreateIndex
CREATE INDEX "market_investment_scores_property_identity_id_idx" ON "market_investment_scores"("property_identity_id");

-- CreateIndex
CREATE INDEX "market_investment_scores_market_region_id_idx" ON "market_investment_scores"("market_region_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_investment_scores_property_identity_id_market_region_key" ON "market_investment_scores"("property_identity_id", "market_region_id");

-- CreateIndex
CREATE INDEX "market_reports_market_region_id_idx" ON "market_reports"("market_region_id");

-- CreateIndex
CREATE INDEX "market_reports_report_period_idx" ON "market_reports"("report_period");

-- CreateIndex
CREATE UNIQUE INDEX "market_reports_market_region_id_report_period_key" ON "market_reports"("market_region_id", "report_period");

-- CreateIndex
CREATE INDEX "market_data_points_city_property_type_date_idx" ON "market_data_points"("city", "property_type", "date");

-- CreateIndex
CREATE INDEX "market_data_points_city_date_idx" ON "market_data_points"("city", "date");

-- CreateIndex
CREATE INDEX "generated_documents_document_type_idx" ON "generated_documents"("document_type");

-- CreateIndex
CREATE INDEX "generated_documents_related_entity_type_related_entity_id_idx" ON "generated_documents"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE INDEX "generated_documents_generated_by_idx" ON "generated_documents"("generated_by");

-- CreateIndex
CREATE INDEX "generated_documents_status_idx" ON "generated_documents"("status");

-- CreateIndex
CREATE INDEX "notaries_jurisdiction_idx" ON "notaries"("jurisdiction");

-- CreateIndex
CREATE INDEX "closing_packages_transaction_id_idx" ON "closing_packages"("transaction_id");

-- CreateIndex
CREATE INDEX "closing_packages_package_status_idx" ON "closing_packages"("package_status");

-- CreateIndex
CREATE INDEX "closing_packages_notary_id_idx" ON "closing_packages"("notary_id");

-- CreateIndex
CREATE INDEX "closing_package_documents_package_id_idx" ON "closing_package_documents"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "closing_package_documents_package_id_document_type_key" ON "closing_package_documents"("package_id", "document_type");

-- CreateIndex
CREATE UNIQUE INDEX "property_verifications_listing_id_key" ON "property_verifications"("listing_id");

-- CreateIndex
CREATE INDEX "property_verifications_verification_status_idx" ON "property_verifications"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_user_id_key" ON "identity_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_verifications_user_id_key" ON "broker_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_tax_registrations_user_id_key" ON "broker_tax_registrations"("user_id");

-- CreateIndex
CREATE INDEX "broker_tax_registrations_status_idx" ON "broker_tax_registrations"("status");

-- CreateIndex
CREATE INDEX "broker_tax_registrations_province_idx" ON "broker_tax_registrations"("province");

-- CreateIndex
CREATE UNIQUE INDEX "property_location_validation_listing_id_key" ON "property_location_validation"("listing_id");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_listingId_idx" ON "AvailabilitySlot"("listingId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_date_idx" ON "AvailabilitySlot"("date");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_booked_by_booking_id_idx" ON "AvailabilitySlot"("booked_by_booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_listingId_date_key" ON "AvailabilitySlot"("listingId", "date");

-- CreateIndex
CREATE INDEX "external_mapping_external_id_idx" ON "external_mapping"("external_id");

-- CreateIndex
CREATE INDEX "external_mapping_sync_status_idx" ON "external_mapping"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "external_mapping_listing_id_platform_key" ON "external_mapping"("listing_id", "platform");

-- CreateIndex
CREATE INDEX "bnhub_channel_sync_logs_listing_id_idx" ON "bnhub_channel_sync_logs"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_channel_sync_logs_created_at_idx" ON "bnhub_channel_sync_logs"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_channel_connections_user_id_idx" ON "bnhub_channel_connections"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_channel_connections_platform_idx" ON "bnhub_channel_connections"("platform");

-- CreateIndex
CREATE INDEX "bnhub_channel_connections_status_idx" ON "bnhub_channel_connections"("status");

-- CreateIndex
CREATE INDEX "bnhub_channel_connections_last_sync_at_idx" ON "bnhub_channel_connections"("last_sync_at");

-- CreateIndex
CREATE INDEX "bnhub_channel_mappings_channel_connection_id_idx" ON "bnhub_channel_mappings"("channel_connection_id");

-- CreateIndex
CREATE INDEX "bnhub_channel_mappings_listing_id_idx" ON "bnhub_channel_mappings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_channel_mappings_listing_connection_key" ON "bnhub_channel_mappings"("listing_id", "channel_connection_id");

-- CreateIndex
CREATE INDEX "bnhub_channel_events_listing_id_idx" ON "bnhub_channel_events"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_channel_events_channel_connection_id_idx" ON "bnhub_channel_events"("channel_connection_id");

-- CreateIndex
CREATE INDEX "bnhub_channel_events_source_idx" ON "bnhub_channel_events"("source");

-- CreateIndex
CREATE INDEX "bnhub_channel_events_start_date_idx" ON "bnhub_channel_events"("start_date");

-- CreateIndex
CREATE INDEX "bnhub_channel_events_platform_idx" ON "bnhub_channel_events"("platform");

-- CreateIndex
CREATE INDEX "bnhub_sync_logs_connection_id_idx" ON "bnhub_sync_logs"("connection_id");

-- CreateIndex
CREATE INDEX "bnhub_sync_logs_listing_id_idx" ON "bnhub_sync_logs"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_sync_logs_created_at_idx" ON "bnhub_sync_logs"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_sync_logs_status_idx" ON "bnhub_sync_logs"("status");

-- CreateIndex
CREATE INDEX "bnhub_payment_accounts_user_id_idx" ON "bnhub_payment_accounts"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_accounts_processor_account_id_idx" ON "bnhub_payment_accounts"("processor_account_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_accounts_onboarding_status_idx" ON "bnhub_payment_accounts"("onboarding_status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payment_accounts_user_processor_role_key" ON "bnhub_payment_accounts"("user_id", "processor", "role_type");

-- CreateIndex
CREATE INDEX "bnhub_payment_quotes_booking_id_idx" ON "bnhub_payment_quotes"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_quotes_listing_id_idx" ON "bnhub_payment_quotes"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_quotes_guest_user_id_idx" ON "bnhub_payment_quotes"("guest_user_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_quotes_host_user_id_idx" ON "bnhub_payment_quotes"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_quotes_expires_at_idx" ON "bnhub_payment_quotes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payments_booking_id_key" ON "bnhub_payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payments_legacy_payment_id_key" ON "bnhub_payments"("legacy_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payments_processor_payment_intent_id_key" ON "bnhub_payments"("processor_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payments_processor_checkout_session_id_key" ON "bnhub_payments"("processor_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payments_idempotency_key_key" ON "bnhub_payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "bnhub_payments_guest_user_id_idx" ON "bnhub_payments"("guest_user_id");

-- CreateIndex
CREATE INDEX "bnhub_payments_host_user_id_idx" ON "bnhub_payments"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_payments_listing_id_idx" ON "bnhub_payments"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_payments_payment_status_idx" ON "bnhub_payments"("payment_status");

-- CreateIndex
CREATE INDEX "bnhub_payments_created_at_idx" ON "bnhub_payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payouts_processor_transfer_id_key" ON "bnhub_payouts"("processor_transfer_id");

-- CreateIndex
CREATE INDEX "bnhub_payouts_booking_id_idx" ON "bnhub_payouts"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_payouts_payment_id_idx" ON "bnhub_payouts"("payment_id");

-- CreateIndex
CREATE INDEX "bnhub_payouts_host_user_id_idx" ON "bnhub_payouts"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_payouts_payout_status_idx" ON "bnhub_payouts"("payout_status");

-- CreateIndex
CREATE INDEX "bnhub_payouts_eligible_release_at_idx" ON "bnhub_payouts"("eligible_release_at");

-- CreateIndex
CREATE INDEX "bnhub_payment_holds_booking_id_idx" ON "bnhub_payment_holds"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_holds_payment_id_idx" ON "bnhub_payment_holds"("payment_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_holds_hold_status_idx" ON "bnhub_payment_holds"("hold_status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_refunds_processor_refund_id_key" ON "bnhub_refunds"("processor_refund_id");

-- CreateIndex
CREATE INDEX "bnhub_refunds_booking_id_idx" ON "bnhub_refunds"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_refunds_payment_id_idx" ON "bnhub_refunds"("payment_id");

-- CreateIndex
CREATE INDEX "bnhub_refunds_refund_status_idx" ON "bnhub_refunds"("refund_status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_disputes_processor_dispute_id_key" ON "bnhub_disputes"("processor_dispute_id");

-- CreateIndex
CREATE INDEX "bnhub_disputes_booking_id_idx" ON "bnhub_disputes"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_disputes_dispute_status_idx" ON "bnhub_disputes"("dispute_status");

-- CreateIndex
CREATE INDEX "bnhub_payment_events_payment_id_idx" ON "bnhub_payment_events"("payment_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_events_booking_id_idx" ON "bnhub_payment_events"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_events_event_type_idx" ON "bnhub_payment_events"("event_type");

-- CreateIndex
CREATE INDEX "bnhub_payment_events_created_at_idx" ON "bnhub_payment_events"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_financial_ledgers_entity_type_entity_id_idx" ON "bnhub_financial_ledgers"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "bnhub_financial_ledgers_booking_id_idx" ON "bnhub_financial_ledgers"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_financial_ledgers_user_id_idx" ON "bnhub_financial_ledgers"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_financial_ledgers_created_at_idx" ON "bnhub_financial_ledgers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_payment_processor_webhooks_event_id_key" ON "bnhub_payment_processor_webhooks"("event_id");

-- CreateIndex
CREATE INDEX "bnhub_payment_processor_webhooks_event_type_idx" ON "bnhub_payment_processor_webhooks"("event_type");

-- CreateIndex
CREATE INDEX "bnhub_payment_processor_webhooks_processing_status_idx" ON "bnhub_payment_processor_webhooks"("processing_status");

-- CreateIndex
CREATE INDEX "bnhub_payment_processor_webhooks_created_at_idx" ON "bnhub_payment_processor_webhooks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_booking_code_key" ON "Booking"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmation_code_key" ON "Booking"("confirmation_code");

-- CreateIndex
CREATE INDEX "Booking_guestId_idx" ON "Booking"("guestId");

-- CreateIndex
CREATE INDEX "Booking_listingId_idx" ON "Booking"("listingId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_checkIn_idx" ON "Booking"("checkIn");

-- CreateIndex
CREATE INDEX "Booking_booking_source_idx" ON "Booking"("booking_source");

-- CreateIndex
CREATE INDEX "bn_guarantees_booking_id_idx" ON "bn_guarantees"("booking_id");

-- CreateIndex
CREATE INDEX "bn_guarantees_status_idx" ON "bn_guarantees"("status");

-- CreateIndex
CREATE INDEX "bnhub_booking_issues_booking_id_idx" ON "bnhub_booking_issues"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_issues_status_idx" ON "bnhub_booking_issues"("status");

-- CreateIndex
CREATE INDEX "BnhubBookingEvent_bookingId_idx" ON "BnhubBookingEvent"("bookingId");

-- CreateIndex
CREATE INDEX "BnhubBookingEvent_eventType_idx" ON "BnhubBookingEvent"("eventType");

-- CreateIndex
CREATE INDEX "BnhubBookingEvent_createdAt_idx" ON "BnhubBookingEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BnhubCheckinDetails_bookingId_key" ON "BnhubCheckinDetails"("bookingId");

-- CreateIndex
CREATE INDEX "BnhubCheckinDetails_bookingId_idx" ON "BnhubCheckinDetails"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_booking_invoices_booking_id_key" ON "bnhub_booking_invoices"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_invoices_booking_id_idx" ON "bnhub_booking_invoices"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_invoices_confirmation_code_idx" ON "bnhub_booking_invoices"("confirmation_code");

-- CreateIndex
CREATE INDEX "bnhub_booking_invoices_linked_contract_id_idx" ON "bnhub_booking_invoices"("linked_contract_id");

-- CreateIndex
CREATE INDEX "BookingMessage_bookingId_idx" ON "BookingMessage"("bookingId");

-- CreateIndex
CREATE INDEX "BookingMessage_senderId_idx" ON "BookingMessage"("senderId");

-- CreateIndex
CREATE INDEX "BookingMessage_listing_code_idx" ON "BookingMessage"("listing_code");

-- CreateIndex
CREATE INDEX "Dispute_bookingId_idx" ON "Dispute"("bookingId");

-- CreateIndex
CREATE INDEX "Dispute_listingId_idx" ON "Dispute"("listingId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_urgency_level_idx" ON "Dispute"("urgency_level");

-- CreateIndex
CREATE INDEX "dispute_resolutions_disputeId_idx" ON "dispute_resolutions"("disputeId");

-- CreateIndex
CREATE INDEX "host_account_warnings_user_id_idx" ON "host_account_warnings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "HostQuality_userId_key" ON "HostQuality"("userId");

-- CreateIndex
CREATE INDEX "HostQuality_userId_idx" ON "HostQuality"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_programId_idx" ON "Referral"("programId");

-- CreateIndex
CREATE INDEX "Referral_invite_kind_idx" ON "Referral"("invite_kind");

-- CreateIndex
CREATE INDEX "Referral_referral_public_code_idx" ON "Referral"("referral_public_code");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_userId_key" ON "Ambassador"("userId");

-- CreateIndex
CREATE INDEX "Commission_ambassadorId_idx" ON "Commission"("ambassadorId");

-- CreateIndex
CREATE INDEX "Commission_sourceType_idx" ON "Commission"("sourceType");

-- CreateIndex
CREATE INDEX "ReferralEvent_code_idx" ON "ReferralEvent"("code");

-- CreateIndex
CREATE INDEX "ReferralEvent_eventType_idx" ON "ReferralEvent"("eventType");

-- CreateIndex
CREATE INDEX "ReferralEvent_userId_idx" ON "ReferralEvent"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_rewardType_idx" ON "ReferralReward"("rewardType");

-- CreateIndex
CREATE INDEX "AmbassadorPayout_ambassadorId_idx" ON "AmbassadorPayout"("ambassadorId");

-- CreateIndex
CREATE INDEX "AmbassadorPayout_status_idx" ON "AmbassadorPayout"("status");

-- CreateIndex
CREATE INDEX "PricingRecommendation_listingId_idx" ON "PricingRecommendation"("listingId");

-- CreateIndex
CREATE INDEX "PricingRecommendation_createdAt_idx" ON "PricingRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "PricingRule_listingId_idx" ON "PricingRule"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchRankingConfig_key_key" ON "SearchRankingConfig"("key");

-- CreateIndex
CREATE INDEX "SearchRankingConfig_key_idx" ON "SearchRankingConfig"("key");

-- CreateIndex
CREATE INDEX "FraudSignal_entityType_entityId_idx" ON "FraudSignal"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FraudSignal_signalType_idx" ON "FraudSignal"("signalType");

-- CreateIndex
CREATE INDEX "FraudSignal_createdAt_idx" ON "FraudSignal"("createdAt");

-- CreateIndex
CREATE INDEX "FraudAlert_status_idx" ON "FraudAlert"("status");

-- CreateIndex
CREATE INDEX "FraudAlert_createdAt_idx" ON "FraudAlert"("createdAt");

-- CreateIndex
CREATE INDEX "listing_investigations_listing_id_idx" ON "listing_investigations"("listing_id");

-- CreateIndex
CREATE INDEX "listing_investigations_status_idx" ON "listing_investigations"("status");

-- CreateIndex
CREATE INDEX "listing_enforcement_actions_listing_id_idx" ON "listing_enforcement_actions"("listing_id");

-- CreateIndex
CREATE INDEX "listing_enforcement_actions_user_id_idx" ON "listing_enforcement_actions"("user_id");

-- CreateIndex
CREATE INDEX "payout_holds_booking_id_idx" ON "payout_holds"("booking_id");

-- CreateIndex
CREATE INDEX "payout_holds_host_id_idx" ON "payout_holds"("host_id");

-- CreateIndex
CREATE INDEX "payout_holds_status_idx" ON "payout_holds"("status");

-- CreateIndex
CREATE INDEX "host_risk_history_host_id_idx" ON "host_risk_history"("host_id");

-- CreateIndex
CREATE INDEX "host_risk_history_risk_type_idx" ON "host_risk_history"("risk_type");

-- CreateIndex
CREATE INDEX "DisputeMessage_disputeId_idx" ON "DisputeMessage"("disputeId");

-- CreateIndex
CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");

-- CreateIndex
CREATE INDEX "HostQualityHistory_userId_idx" ON "HostQualityHistory"("userId");

-- CreateIndex
CREATE INDEX "HostQualityHistory_snapshotAt_idx" ON "HostQualityHistory"("snapshotAt");

-- CreateIndex
CREATE INDEX "SupplyGrowthMetric_date_idx" ON "SupplyGrowthMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyGrowthMetric_date_key" ON "SupplyGrowthMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_payout_hold_reason_idx" ON "payments"("payout_hold_reason");

-- CreateIndex
CREATE INDEX "payments_linked_contract_id_idx" ON "payments"("linked_contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_payments_stripe_session_id_key" ON "platform_payments"("stripe_session_id");

-- CreateIndex
CREATE INDEX "platform_payments_user_id_idx" ON "platform_payments"("user_id");

-- CreateIndex
CREATE INDEX "platform_payments_booking_id_idx" ON "platform_payments"("booking_id");

-- CreateIndex
CREATE INDEX "platform_payments_deal_id_idx" ON "platform_payments"("deal_id");

-- CreateIndex
CREATE INDEX "platform_payments_fsbo_listing_id_idx" ON "platform_payments"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "platform_payments_payment_type_idx" ON "platform_payments"("payment_type");

-- CreateIndex
CREATE INDEX "platform_payments_status_idx" ON "platform_payments"("status");

-- CreateIndex
CREATE INDEX "platform_payments_stripe_session_id_idx" ON "platform_payments"("stripe_session_id");

-- CreateIndex
CREATE INDEX "platform_payments_linked_contract_id_idx" ON "platform_payments"("linked_contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rules_source_type_key" ON "commission_rules"("source_type");

-- CreateIndex
CREATE INDEX "broker_commissions_payment_id_idx" ON "broker_commissions"("payment_id");

-- CreateIndex
CREATE INDEX "broker_commissions_broker_id_idx" ON "broker_commissions"("broker_id");

-- CreateIndex
CREATE INDEX "broker_commissions_status_idx" ON "broker_commissions"("status");

-- CreateIndex
CREATE INDEX "broker_payouts_broker_id_idx" ON "broker_payouts"("broker_id");

-- CreateIndex
CREATE INDEX "broker_payouts_status_idx" ON "broker_payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "broker_payout_lines_commission_id_key" ON "broker_payout_lines"("commission_id");

-- CreateIndex
CREATE INDEX "broker_payout_lines_payout_id_idx" ON "broker_payout_lines"("payout_id");

-- CreateIndex
CREATE UNIQUE INDEX "deals_deal_code_key" ON "deals"("deal_code");

-- CreateIndex
CREATE UNIQUE INDEX "deals_lead_id_key" ON "deals"("lead_id");

-- CreateIndex
CREATE INDEX "deals_buyer_id_idx" ON "deals"("buyer_id");

-- CreateIndex
CREATE INDEX "deals_seller_id_idx" ON "deals"("seller_id");

-- CreateIndex
CREATE INDEX "deals_broker_id_idx" ON "deals"("broker_id");

-- CreateIndex
CREATE INDEX "deals_status_idx" ON "deals"("status");

-- CreateIndex
CREATE INDEX "deals_crm_stage_idx" ON "deals"("crm_stage");

-- CreateIndex
CREATE INDEX "deals_listing_code_idx" ON "deals"("listing_code");

-- CreateIndex
CREATE INDEX "deals_lead_id_idx" ON "deals"("lead_id");

-- CreateIndex
CREATE INDEX "deals_workspace_id_idx" ON "deals"("workspace_id");

-- CreateIndex
CREATE INDEX "deal_milestones_deal_id_idx" ON "deal_milestones"("deal_id");

-- CreateIndex
CREATE INDEX "deal_documents_deal_id_idx" ON "deal_documents"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_invoice_number_key" ON "platform_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "platform_invoices_user_id_idx" ON "platform_invoices"("user_id");

-- CreateIndex
CREATE INDEX "platform_invoices_payment_id_idx" ON "platform_invoices"("payment_id");

-- CreateIndex
CREATE INDEX "platform_invoices_invoice_issuer_idx" ON "platform_invoices"("invoice_issuer");

-- CreateIndex
CREATE INDEX "platform_invoices_status_idx" ON "platform_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_payment_id_invoice_issuer_key" ON "platform_invoices"("payment_id", "invoice_issuer");

-- CreateIndex
CREATE UNIQUE INDEX "party_revenue_ledger_entries_broker_commission_id_key" ON "party_revenue_ledger_entries"("broker_commission_id");

-- CreateIndex
CREATE INDEX "party_revenue_ledger_entries_platform_payment_id_idx" ON "party_revenue_ledger_entries"("platform_payment_id");

-- CreateIndex
CREATE INDEX "party_revenue_ledger_entries_party_idx" ON "party_revenue_ledger_entries"("party");

-- CreateIndex
CREATE INDEX "party_revenue_ledger_entries_broker_id_idx" ON "party_revenue_ledger_entries"("broker_id");

-- CreateIndex
CREATE INDEX "party_revenue_ledger_entries_category_idx" ON "party_revenue_ledger_entries"("category");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_ledger_entries_stripe_event_id_key" ON "stripe_ledger_entries"("stripe_event_id");

-- CreateIndex
CREATE INDEX "stripe_ledger_entries_user_id_idx" ON "stripe_ledger_entries"("user_id");

-- CreateIndex
CREATE INDEX "stripe_ledger_entries_platform_payment_id_idx" ON "stripe_ledger_entries"("platform_payment_id");

-- CreateIndex
CREATE INDEX "stripe_ledger_entries_created_at_idx" ON "stripe_ledger_entries"("created_at");

-- CreateIndex
CREATE INDEX "financial_audit_logs_actor_user_id_idx" ON "financial_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "financial_audit_logs_created_at_idx" ON "financial_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "tax_documents_subject_user_id_idx" ON "tax_documents"("subject_user_id");

-- CreateIndex
CREATE INDEX "tax_documents_document_type_idx" ON "tax_documents"("document_type");

-- CreateIndex
CREATE INDEX "tax_documents_period_year_idx" ON "tax_documents"("period_year");

-- CreateIndex
CREATE INDEX "tax_documents_status_idx" ON "tax_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_listingId_idx" ON "Review"("listingId");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "property_rating_aggregates_listing_id_key" ON "property_rating_aggregates"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "host_performance_host_id_key" ON "host_performance"("host_id");

-- CreateIndex
CREATE INDEX "host_badges_host_id_idx" ON "host_badges"("host_id");

-- CreateIndex
CREATE UNIQUE INDEX "host_badges_host_id_badge_type_key" ON "host_badges"("host_id", "badge_type");

-- CreateIndex
CREATE INDEX "listing_ranking_scores_listing_type_city_idx" ON "listing_ranking_scores"("listing_type", "city");

-- CreateIndex
CREATE INDEX "listing_ranking_scores_listing_type_total_score_idx" ON "listing_ranking_scores"("listing_type", "total_score");

-- CreateIndex
CREATE INDEX "listing_ranking_scores_city_neighborhood_idx" ON "listing_ranking_scores"("city", "neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "listing_ranking_scores_listing_type_listing_id_key" ON "listing_ranking_scores"("listing_type", "listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_configs_config_key_key" ON "ranking_configs"("config_key");

-- CreateIndex
CREATE INDEX "ranking_configs_listing_type_is_active_idx" ON "ranking_configs"("listing_type", "is_active");

-- CreateIndex
CREATE INDEX "ranking_impression_logs_listing_type_listing_id_idx" ON "ranking_impression_logs"("listing_type", "listing_id");

-- CreateIndex
CREATE INDEX "ranking_impression_logs_page_type_created_at_idx" ON "ranking_impression_logs"("page_type", "created_at");

-- CreateIndex
CREATE INDEX "ranking_impression_logs_city_created_at_idx" ON "ranking_impression_logs"("city", "created_at");

-- CreateIndex
CREATE INDEX "ranking_click_logs_listing_type_listing_id_idx" ON "ranking_click_logs"("listing_type", "listing_id");

-- CreateIndex
CREATE INDEX "ranking_click_logs_page_type_created_at_idx" ON "ranking_click_logs"("page_type", "created_at");

-- CreateIndex
CREATE INDEX "fraud_risk_scores_entity_type_risk_level_idx" ON "fraud_risk_scores"("entity_type", "risk_level");

-- CreateIndex
CREATE INDEX "fraud_risk_scores_risk_score_idx" ON "fraud_risk_scores"("risk_score");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_risk_scores_entity_type_entity_id_key" ON "fraud_risk_scores"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "fraud_flags_entity_type_entity_id_idx" ON "fraud_flags"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "fraud_flags_flag_type_severity_idx" ON "fraud_flags"("flag_type", "severity");

-- CreateIndex
CREATE INDEX "fraud_flags_status_idx" ON "fraud_flags"("status");

-- CreateIndex
CREATE INDEX "fraud_review_queue_status_priority_idx" ON "fraud_review_queue"("status", "priority");

-- CreateIndex
CREATE INDEX "fraud_action_logs_entity_type_entity_id_idx" ON "fraud_action_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "fraud_action_logs_action_type_created_at_idx" ON "fraud_action_logs"("action_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "city_operation_profiles_city_key_key" ON "city_operation_profiles"("city_key");

-- CreateIndex
CREATE INDEX "city_operation_profiles_is_active_launch_stage_idx" ON "city_operation_profiles"("is_active", "launch_stage");

-- CreateIndex
CREATE INDEX "city_kpi_snapshots_city_key_snapshot_type_snapshot_date_idx" ON "city_kpi_snapshots"("city_key", "snapshot_type", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "city_kpi_snapshots_city_key_snapshot_type_snapshot_date_key" ON "city_kpi_snapshots"("city_key", "snapshot_type", "snapshot_date");

-- CreateIndex
CREATE INDEX "city_recommendations_city_key_status_priority_score_idx" ON "city_recommendations"("city_key", "status", "priority_score");

-- CreateIndex
CREATE INDEX "city_rollout_events_city_key_event_type_idx" ON "city_rollout_events"("city_key", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "OperationalControl_controlType_idx" ON "OperationalControl"("controlType");

-- CreateIndex
CREATE INDEX "OperationalControl_targetType_targetId_idx" ON "OperationalControl"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "OperationalControl_active_idx" ON "OperationalControl"("active");

-- CreateIndex
CREATE INDEX "ControlActionAuditLog_controlId_idx" ON "ControlActionAuditLog"("controlId");

-- CreateIndex
CREATE INDEX "ControlActionAuditLog_createdAt_idx" ON "ControlActionAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceHealthMetric_serviceName_metricName_idx" ON "ServiceHealthMetric"("serviceName", "metricName");

-- CreateIndex
CREATE INDEX "ServiceHealthMetric_createdAt_idx" ON "ServiceHealthMetric"("createdAt");

-- CreateIndex
CREATE INDEX "SystemAlert_alertType_idx" ON "SystemAlert"("alertType");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_resolvedAt_idx" ON "SystemAlert"("resolvedAt");

-- CreateIndex
CREATE INDEX "SystemAlert_createdAt_idx" ON "SystemAlert"("createdAt");

-- CreateIndex
CREATE INDEX "platform_events_event_type_idx" ON "platform_events"("event_type");

-- CreateIndex
CREATE INDEX "platform_events_source_module_idx" ON "platform_events"("source_module");

-- CreateIndex
CREATE INDEX "platform_events_entity_type_entity_id_idx" ON "platform_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "platform_events_processing_status_idx" ON "platform_events"("processing_status");

-- CreateIndex
CREATE INDEX "platform_events_created_at_idx" ON "platform_events"("created_at");

-- CreateIndex
CREATE INDEX "ai_property_recommendations_entity_type_entity_id_idx" ON "ai_property_recommendations"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_property_recommendations_agent_type_idx" ON "ai_property_recommendations"("agent_type");

-- CreateIndex
CREATE INDEX "ai_property_recommendations_status_idx" ON "ai_property_recommendations"("status");

-- CreateIndex
CREATE INDEX "ai_property_recommendations_created_at_idx" ON "ai_property_recommendations"("created_at");

-- CreateIndex
CREATE INDEX "ai_property_alerts_entity_type_entity_id_idx" ON "ai_property_alerts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_property_alerts_alert_type_idx" ON "ai_property_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "ai_property_alerts_severity_idx" ON "ai_property_alerts"("severity");

-- CreateIndex
CREATE INDEX "ai_property_alerts_status_idx" ON "ai_property_alerts"("status");

-- CreateIndex
CREATE INDEX "ai_property_scores_entity_type_entity_id_idx" ON "ai_property_scores"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_property_scores_score_type_idx" ON "ai_property_scores"("score_type");

-- CreateIndex
CREATE INDEX "ai_property_scores_created_at_idx" ON "ai_property_scores"("created_at");

-- CreateIndex
CREATE INDEX "ai_property_manager_decisions_entity_type_entity_id_idx" ON "ai_property_manager_decisions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_property_manager_decisions_agent_type_idx" ON "ai_property_manager_decisions"("agent_type");

-- CreateIndex
CREATE INDEX "ai_property_manager_decisions_created_at_idx" ON "ai_property_manager_decisions"("created_at");

-- CreateIndex
CREATE INDEX "OperationalIncident_status_idx" ON "OperationalIncident"("status");

-- CreateIndex
CREATE INDEX "OperationalIncident_severity_idx" ON "OperationalIncident"("severity");

-- CreateIndex
CREATE INDEX "OperationalIncident_startedAt_idx" ON "OperationalIncident"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRule_key_key" ON "PolicyRule"("key");

-- CreateIndex
CREATE INDEX "PolicyRule_key_idx" ON "PolicyRule"("key");

-- CreateIndex
CREATE INDEX "PolicyRule_ruleType_idx" ON "PolicyRule"("ruleType");

-- CreateIndex
CREATE INDEX "PolicyRule_active_idx" ON "PolicyRule"("active");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_ruleKey_idx" ON "PolicyDecisionLog"("ruleKey");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_entityType_entityId_idx" ON "PolicyDecisionLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_evaluatedAt_idx" ON "PolicyDecisionLog"("evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_module_idx" ON "SubscriptionPlan"("module");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_active_idx" ON "SubscriptionPlan"("active");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_market_id_idx" ON "SubscriptionPlan"("market_id");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "BillingEvent_subscriptionId_idx" ON "BillingEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingEvent_userId_idx" ON "BillingEvent"("userId");

-- CreateIndex
CREATE INDEX "BillingEvent_eventType_idx" ON "BillingEvent"("eventType");

-- CreateIndex
CREATE INDEX "BillingEvent_createdAt_idx" ON "BillingEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_workspace_id" ON "subscriptions"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_plan_code" ON "subscriptions"("plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_stripe_event_id_key" ON "billing_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "idx_billing_events_subscription_id" ON "billing_events"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_billing_events_workspace_id" ON "billing_events"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_billing_events_user_id" ON "billing_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_billing_events_event_type" ON "billing_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_copilot_conversations_user_id" ON "copilot_conversations"("user_id");

-- CreateIndex
CREATE INDEX "idx_copilot_conversations_workspace_id" ON "copilot_conversations"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_copilot_messages_conversation_id" ON "copilot_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_copilot_messages_role" ON "copilot_messages"("role");

-- CreateIndex
CREATE INDEX "idx_copilot_runs_conversation_id" ON "copilot_runs"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_copilot_runs_user_id" ON "copilot_runs"("user_id");

-- CreateIndex
CREATE INDEX "idx_copilot_runs_workspace_id" ON "copilot_runs"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_copilot_runs_intent" ON "copilot_runs"("intent");

-- CreateIndex
CREATE INDEX "idx_copilot_runs_status" ON "copilot_runs"("status");

-- CreateIndex
CREATE INDEX "idx_copilot_memory_user_id" ON "copilot_memory_items"("user_id");

-- CreateIndex
CREATE INDEX "idx_copilot_memory_workspace_id" ON "copilot_memory_items"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_copilot_memory_type" ON "copilot_memory_items"("memory_type");

-- CreateIndex
CREATE INDEX "idx_copilot_memory_listing_id" ON "copilot_memory_items"("listing_id");

-- CreateIndex
CREATE INDEX "idx_copilot_memory_city" ON "copilot_memory_items"("city");

-- CreateIndex
CREATE INDEX "idx_copilot_memory_property_type" ON "copilot_memory_items"("property_type");

-- CreateIndex
CREATE INDEX "idx_ai_feedback_subsystem" ON "ai_feedback_events"("subsystem");

-- CreateIndex
CREATE INDEX "idx_ai_feedback_entity" ON "ai_feedback_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_ai_feedback_user" ON "ai_feedback_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_ai_feedback_created_at" ON "ai_feedback_events"("created_at");

-- CreateIndex
CREATE INDEX "idx_ai_eval_runs_subsystem" ON "ai_eval_runs"("subsystem");

-- CreateIndex
CREATE INDEX "idx_ai_eval_runs_status" ON "ai_eval_runs"("status");

-- CreateIndex
CREATE INDEX "idx_ai_eval_runs_created_at" ON "ai_eval_runs"("created_at");

-- CreateIndex
CREATE INDEX "idx_ai_eval_items_run_id" ON "ai_eval_items"("eval_run_id");

-- CreateIndex
CREATE INDEX "idx_ai_eval_items_created_at" ON "ai_eval_items"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_profiles_user_id_key" ON "conversion_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_conversion_profile_stage" ON "conversion_profiles"("stage");

-- CreateIndex
CREATE INDEX "idx_conversion_profile_last_active" ON "conversion_profiles"("last_active_at");

-- CreateIndex
CREATE INDEX "idx_conversion_auto_user" ON "conversion_automation_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_conversion_auto_trigger_created" ON "conversion_automation_logs"("trigger_type", "created_at");

-- CreateIndex
CREATE INDEX "PromotionCampaign_marketId_idx" ON "PromotionCampaign"("marketId");

-- CreateIndex
CREATE INDEX "PromotionCampaign_status_idx" ON "PromotionCampaign"("status");

-- CreateIndex
CREATE INDEX "PromotionCampaign_startAt_idx" ON "PromotionCampaign"("startAt");

-- CreateIndex
CREATE INDEX "PromotedListing_listingId_idx" ON "PromotedListing"("listingId");

-- CreateIndex
CREATE INDEX "PromotedListing_campaignId_idx" ON "PromotedListing"("campaignId");

-- CreateIndex
CREATE INDEX "PromotedListing_status_idx" ON "PromotedListing"("status");

-- CreateIndex
CREATE INDEX "PromotedListing_startAt_idx" ON "PromotedListing"("startAt");

-- CreateIndex
CREATE INDEX "bnhub_marketing_campaigns_listing_id_idx" ON "bnhub_marketing_campaigns"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_campaigns_host_user_id_idx" ON "bnhub_marketing_campaigns"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_campaigns_status_idx" ON "bnhub_marketing_campaigns"("status");

-- CreateIndex
CREATE INDEX "bnhub_marketing_campaigns_created_at_idx" ON "bnhub_marketing_campaigns"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_marketing_assets_campaign_id_idx" ON "bnhub_marketing_assets"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_assets_listing_id_idx" ON "bnhub_marketing_assets"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_assets_asset_type_idx" ON "bnhub_marketing_assets"("asset_type");

-- CreateIndex
CREATE INDEX "bnhub_marketing_assets_language_code_idx" ON "bnhub_marketing_assets"("language_code");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_distribution_channels_code_key" ON "bnhub_distribution_channels"("code");

-- CreateIndex
CREATE INDEX "bnhub_distribution_channels_channel_type_idx" ON "bnhub_distribution_channels"("channel_type");

-- CreateIndex
CREATE INDEX "bnhub_distribution_channels_enabled_idx" ON "bnhub_distribution_channels"("enabled");

-- CreateIndex
CREATE INDEX "bnhub_campaign_distributions_campaign_id_idx" ON "bnhub_campaign_distributions"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_campaign_distributions_channel_id_idx" ON "bnhub_campaign_distributions"("channel_id");

-- CreateIndex
CREATE INDEX "bnhub_campaign_distributions_distribution_status_idx" ON "bnhub_campaign_distributions"("distribution_status");

-- CreateIndex
CREATE INDEX "bnhub_campaign_distributions_scheduled_at_idx" ON "bnhub_campaign_distributions"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_listing_marketing_profiles_listing_id_key" ON "bnhub_listing_marketing_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_marketing_profiles_readiness_score_idx" ON "bnhub_listing_marketing_profiles"("readiness_score");

-- CreateIndex
CREATE INDEX "bnhub_marketing_events_campaign_id_idx" ON "bnhub_marketing_events"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_events_distribution_id_idx" ON "bnhub_marketing_events"("distribution_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_events_event_type_idx" ON "bnhub_marketing_events"("event_type");

-- CreateIndex
CREATE INDEX "bnhub_marketing_events_created_at_idx" ON "bnhub_marketing_events"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_marketing_recommendations_listing_id_idx" ON "bnhub_marketing_recommendations"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_recommendations_campaign_id_idx" ON "bnhub_marketing_recommendations"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_marketing_recommendations_status_idx" ON "bnhub_marketing_recommendations"("status");

-- CreateIndex
CREATE INDEX "bnhub_marketing_recommendations_priority_idx" ON "bnhub_marketing_recommendations"("priority");

-- CreateIndex
CREATE INDEX "bnhub_email_campaign_queue_campaign_id_idx" ON "bnhub_email_campaign_queue"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_email_campaign_queue_listing_id_idx" ON "bnhub_email_campaign_queue"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_email_campaign_queue_status_idx" ON "bnhub_email_campaign_queue"("status");

-- CreateIndex
CREATE INDEX "bnhub_email_campaign_queue_scheduled_at_idx" ON "bnhub_email_campaign_queue"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_host_growth_prefs_user_id_key" ON "bnhub_host_growth_prefs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_growth_campaigns_promo_slug_key" ON "bnhub_growth_campaigns"("promo_slug");

-- CreateIndex
CREATE INDEX "bnhub_growth_campaigns_listing_id_idx" ON "bnhub_growth_campaigns"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_campaigns_host_user_id_idx" ON "bnhub_growth_campaigns"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_campaigns_status_idx" ON "bnhub_growth_campaigns"("status");

-- CreateIndex
CREATE INDEX "bnhub_growth_campaigns_autonomy_level_idx" ON "bnhub_growth_campaigns"("autonomy_level");

-- CreateIndex
CREATE INDEX "bnhub_growth_campaigns_created_at_idx" ON "bnhub_growth_campaigns"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_growth_assets_campaign_id_idx" ON "bnhub_growth_assets"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_assets_listing_id_idx" ON "bnhub_growth_assets"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_assets_asset_family_idx" ON "bnhub_growth_assets"("asset_family");

-- CreateIndex
CREATE INDEX "bnhub_growth_assets_language_code_idx" ON "bnhub_growth_assets"("language_code");

-- CreateIndex
CREATE INDEX "bnhub_growth_assets_approval_status_idx" ON "bnhub_growth_assets"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_growth_connectors_connector_code_key" ON "bnhub_growth_connectors"("connector_code");

-- CreateIndex
CREATE INDEX "bnhub_growth_connectors_connector_type_idx" ON "bnhub_growth_connectors"("connector_type");

-- CreateIndex
CREATE INDEX "bnhub_growth_connectors_status_idx" ON "bnhub_growth_connectors"("status");

-- CreateIndex
CREATE INDEX "bnhub_growth_distributions_campaign_id_idx" ON "bnhub_growth_distributions"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_distributions_connector_id_idx" ON "bnhub_growth_distributions"("connector_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_distributions_distribution_status_idx" ON "bnhub_growth_distributions"("distribution_status");

-- CreateIndex
CREATE INDEX "bnhub_growth_distributions_scheduled_at_idx" ON "bnhub_growth_distributions"("scheduled_at");

-- CreateIndex
CREATE INDEX "bnhub_growth_distributions_publish_locked_until_idx" ON "bnhub_growth_distributions"("publish_locked_until");

-- CreateIndex
CREATE INDEX "bnhub_leads_listing_id_idx" ON "bnhub_leads"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_leads_campaign_id_idx" ON "bnhub_leads"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_leads_distribution_id_idx" ON "bnhub_leads"("distribution_id");

-- CreateIndex
CREATE INDEX "bnhub_leads_host_user_id_idx" ON "bnhub_leads"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_leads_status_idx" ON "bnhub_leads"("status");

-- CreateIndex
CREATE INDEX "bnhub_leads_lead_temperature_idx" ON "bnhub_leads"("lead_temperature");

-- CreateIndex
CREATE INDEX "bnhub_leads_created_at_idx" ON "bnhub_leads"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_leads_source_type_idx" ON "bnhub_leads"("source_type");

-- CreateIndex
CREATE INDEX "bnhub_leads_dedupe_key_idx" ON "bnhub_leads"("dedupe_key");

-- CreateIndex
CREATE INDEX "bnhub_leads_response_due_at_idx" ON "bnhub_leads"("response_due_at");

-- CreateIndex
CREATE INDEX "bnhub_lead_events_lead_id_idx" ON "bnhub_lead_events"("lead_id");

-- CreateIndex
CREATE INDEX "bnhub_lead_events_event_type_idx" ON "bnhub_lead_events"("event_type");

-- CreateIndex
CREATE INDEX "bnhub_lead_events_created_at_idx" ON "bnhub_lead_events"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_growth_recommendations_listing_id_idx" ON "bnhub_growth_recommendations"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_recommendations_campaign_id_idx" ON "bnhub_growth_recommendations"("campaign_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_recommendations_status_idx" ON "bnhub_growth_recommendations"("status");

-- CreateIndex
CREATE INDEX "bnhub_growth_recommendations_priority_idx" ON "bnhub_growth_recommendations"("priority");

-- CreateIndex
CREATE INDEX "bnhub_growth_rules_scope_type_idx" ON "bnhub_growth_rules"("scope_type");

-- CreateIndex
CREATE INDEX "bnhub_growth_rules_scope_id_idx" ON "bnhub_growth_rules"("scope_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_rules_trigger_type_idx" ON "bnhub_growth_rules"("trigger_type");

-- CreateIndex
CREATE INDEX "bnhub_growth_rules_is_enabled_idx" ON "bnhub_growth_rules"("is_enabled");

-- CreateIndex
CREATE INDEX "bnhub_connector_tokens_connector_code_idx" ON "bnhub_connector_tokens"("connector_code");

-- CreateIndex
CREATE INDEX "bnhub_connector_tokens_owner_type_owner_id_idx" ON "bnhub_connector_tokens"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "bnhub_connector_tokens_token_status_idx" ON "bnhub_connector_tokens"("token_status");

-- CreateIndex
CREATE INDEX "bnhub_growth_audit_logs_entity_type_entity_id_idx" ON "bnhub_growth_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "bnhub_growth_audit_logs_actor_type_idx" ON "bnhub_growth_audit_logs"("actor_type");

-- CreateIndex
CREATE INDEX "bnhub_growth_audit_logs_created_at_idx" ON "bnhub_growth_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "platform_revenue_events_entity_type_entity_id_idx" ON "platform_revenue_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "platform_revenue_events_revenue_type_idx" ON "platform_revenue_events"("revenue_type");

-- CreateIndex
CREATE INDEX "platform_revenue_events_status_idx" ON "platform_revenue_events"("status");

-- CreateIndex
CREATE INDEX "platform_revenue_events_created_at_idx" ON "platform_revenue_events"("created_at");

-- CreateIndex
CREATE INDEX "platform_revenue_events_market_id_idx" ON "platform_revenue_events"("market_id");

-- CreateIndex
CREATE INDEX "revenue_events_user_id_created_at_idx" ON "revenue_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "revenue_events_event_type_created_at_idx" ON "revenue_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "revenue_opportunities_user_id_status_idx" ON "revenue_opportunities"("user_id", "status");

-- CreateIndex
CREATE INDEX "revenue_opportunities_lead_id_status_idx" ON "revenue_opportunities"("lead_id", "status");

-- CreateIndex
CREATE INDEX "revenue_opportunities_status_created_at_idx" ON "revenue_opportunities"("status", "created_at");

-- CreateIndex
CREATE INDEX "investor_metric_snapshots_date_idx" ON "investor_metric_snapshots"("date");

-- CreateIndex
CREATE UNIQUE INDEX "investor_metric_snapshots_date_key" ON "investor_metric_snapshots"("date");

-- CreateIndex
CREATE INDEX "fundraising_investors_stage_idx" ON "fundraising_investors"("stage");

-- CreateIndex
CREATE INDEX "fundraising_investors_email_idx" ON "fundraising_investors"("email");

-- CreateIndex
CREATE INDEX "fundraising_investor_interactions_investor_id_created_at_idx" ON "fundraising_investor_interactions"("investor_id", "created_at");

-- CreateIndex
CREATE INDEX "fundraising_deals_investor_id_idx" ON "fundraising_deals"("investor_id");

-- CreateIndex
CREATE INDEX "fundraising_deals_status_idx" ON "fundraising_deals"("status");

-- CreateIndex
CREATE INDEX "fundraising_rounds_status_idx" ON "fundraising_rounds"("status");

-- CreateIndex
CREATE INDEX "investor_commitments_round_id_idx" ON "investor_commitments"("round_id");

-- CreateIndex
CREATE INDEX "investor_commitments_investor_id_idx" ON "investor_commitments"("investor_id");

-- CreateIndex
CREATE INDEX "investor_commitments_status_idx" ON "investor_commitments"("status");

-- CreateIndex
CREATE INDEX "revenue_execution_days_date_idx" ON "revenue_execution_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_execution_days_date_key" ON "revenue_execution_days"("date");

-- CreateIndex
CREATE INDEX "revenue_execution_actions_user_id_created_at_idx" ON "revenue_execution_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "revenue_execution_actions_type_created_at_idx" ON "revenue_execution_actions"("type", "created_at");

-- CreateIndex
CREATE INDEX "pitch_decks_created_at_idx" ON "pitch_decks"("created_at");

-- CreateIndex
CREATE INDEX "pitch_deck_slides_deck_id_order_idx" ON "pitch_deck_slides"("deck_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "sales_agents_user_id_key" ON "sales_agents"("user_id");

-- CreateIndex
CREATE INDEX "sales_agents_active_priority_weight_idx" ON "sales_agents"("active", "priority_weight");

-- CreateIndex
CREATE UNIQUE INDEX "sales_assignments_lead_id_key" ON "sales_assignments"("lead_id");

-- CreateIndex
CREATE INDEX "sales_assignments_agent_id_status_idx" ON "sales_assignments"("agent_id", "status");

-- CreateIndex
CREATE INDEX "sales_assignments_status_idx" ON "sales_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_performance_agent_id_key" ON "sales_performance"("agent_id");

-- CreateIndex
CREATE INDEX "hiring_candidates_stage_idx" ON "hiring_candidates"("stage");

-- CreateIndex
CREATE INDEX "hiring_candidates_role_idx" ON "hiring_candidates"("role");

-- CreateIndex
CREATE INDEX "hiring_candidates_email_idx" ON "hiring_candidates"("email");

-- CreateIndex
CREATE INDEX "hiring_candidates_performance_flag_idx" ON "hiring_candidates"("performance_flag");

-- CreateIndex
CREATE INDEX "hiring_candidate_interactions_candidate_id_created_at_idx" ON "hiring_candidate_interactions"("candidate_id", "created_at");

-- CreateIndex
CREATE INDEX "hiring_candidate_evaluations_candidate_id_created_at_idx" ON "hiring_candidate_evaluations"("candidate_id", "created_at");

-- CreateIndex
CREATE INDEX "hiring_candidate_trial_tasks_candidate_id_status_idx" ON "hiring_candidate_trial_tasks"("candidate_id", "status");

-- CreateIndex
CREATE INDEX "equity_holders_role_idx" ON "equity_holders"("role");

-- CreateIndex
CREATE INDEX "equity_grants_holder_id_idx" ON "equity_grants"("holder_id");

-- CreateIndex
CREATE INDEX "payout_adjustments_booking_id_idx" ON "payout_adjustments"("booking_id");

-- CreateIndex
CREATE INDEX "payout_adjustments_adjustment_type_idx" ON "payout_adjustments"("adjustment_type");

-- CreateIndex
CREATE INDEX "payout_adjustments_createdAt_idx" ON "payout_adjustments"("createdAt");

-- CreateIndex
CREATE INDEX "GrowthCampaign_marketId_idx" ON "GrowthCampaign"("marketId");

-- CreateIndex
CREATE INDEX "GrowthCampaign_status_idx" ON "GrowthCampaign"("status");

-- CreateIndex
CREATE INDEX "AcquisitionSource_userId_idx" ON "AcquisitionSource"("userId");

-- CreateIndex
CREATE INDEX "AcquisitionSource_campaignId_idx" ON "AcquisitionSource"("campaignId");

-- CreateIndex
CREATE INDEX "AcquisitionSource_source_idx" ON "AcquisitionSource"("source");

-- CreateIndex
CREATE INDEX "OnboardingMilestone_userId_idx" ON "OnboardingMilestone"("userId");

-- CreateIndex
CREATE INDEX "OnboardingMilestone_milestoneKey_idx" ON "OnboardingMilestone"("milestoneKey");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingMilestone_userId_milestoneKey_key" ON "OnboardingMilestone"("userId", "milestoneKey");

-- CreateIndex
CREATE INDEX "LifecycleState_userId_idx" ON "LifecycleState"("userId");

-- CreateIndex
CREATE INDEX "LifecycleState_stage_idx" ON "LifecycleState"("stage");

-- CreateIndex
CREATE INDEX "LifecycleState_module_idx" ON "LifecycleState"("module");

-- CreateIndex
CREATE UNIQUE INDEX "MarketConfig_code_key" ON "MarketConfig"("code");

-- CreateIndex
CREATE INDEX "MarketConfig_active_idx" ON "MarketConfig"("active");

-- CreateIndex
CREATE INDEX "MarketConfig_code_idx" ON "MarketConfig"("code");

-- CreateIndex
CREATE INDEX "MarketTaxRule_marketId_idx" ON "MarketTaxRule"("marketId");

-- CreateIndex
CREATE INDEX "MarketPolicyBinding_marketId_idx" ON "MarketPolicyBinding"("marketId");

-- CreateIndex
CREATE INDEX "MarketPolicyBinding_policyRuleKey_idx" ON "MarketPolicyBinding"("policyRuleKey");

-- CreateIndex
CREATE INDEX "RevenueLedgerEntry_type_idx" ON "RevenueLedgerEntry"("type");

-- CreateIndex
CREATE INDEX "RevenueLedgerEntry_entityType_entityId_idx" ON "RevenueLedgerEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RevenueLedgerEntry_marketId_idx" ON "RevenueLedgerEntry"("marketId");

-- CreateIndex
CREATE INDEX "RevenueLedgerEntry_createdAt_idx" ON "RevenueLedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "RevenueReport_reportType_idx" ON "RevenueReport"("reportType");

-- CreateIndex
CREATE INDEX "RevenueReport_periodStart_idx" ON "RevenueReport"("periodStart");

-- CreateIndex
CREATE INDEX "RevenueReport_marketId_idx" ON "RevenueReport"("marketId");

-- CreateIndex
CREATE INDEX "ExecutiveMetricsSnapshot_date_idx" ON "ExecutiveMetricsSnapshot"("date");

-- CreateIndex
CREATE INDEX "ExecutiveMetricsSnapshot_marketId_idx" ON "ExecutiveMetricsSnapshot"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveMetricsSnapshot_date_marketId_key" ON "ExecutiveMetricsSnapshot"("date", "marketId");

-- CreateIndex
CREATE INDEX "AiFeature_entityType_featureKey_idx" ON "AiFeature"("entityType", "featureKey");

-- CreateIndex
CREATE INDEX "AiFeature_computedAt_idx" ON "AiFeature"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiFeature_entityType_entityId_featureKey_key" ON "AiFeature"("entityType", "entityId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_key_key" ON "AiModel"("key");

-- CreateIndex
CREATE INDEX "AiModel_key_idx" ON "AiModel"("key");

-- CreateIndex
CREATE INDEX "ModelVersion_modelId_idx" ON "ModelVersion"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelVersion_modelId_version_key" ON "ModelVersion"("modelId", "version");

-- CreateIndex
CREATE INDEX "FraudScore_entityType_entityId_idx" ON "FraudScore"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FraudScore_score_idx" ON "FraudScore"("score");

-- CreateIndex
CREATE INDEX "FraudScore_createdAt_idx" ON "FraudScore"("createdAt");

-- CreateIndex
CREATE INDEX "AiPricingRecommendation_listingId_idx" ON "AiPricingRecommendation"("listingId");

-- CreateIndex
CREATE INDEX "AiPricingRecommendation_forDate_idx" ON "AiPricingRecommendation"("forDate");

-- CreateIndex
CREATE INDEX "AiPricingRecommendation_createdAt_idx" ON "AiPricingRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "SearchRankingScore_listingId_idx" ON "SearchRankingScore"("listingId");

-- CreateIndex
CREATE INDEX "SearchRankingScore_score_idx" ON "SearchRankingScore"("score");

-- CreateIndex
CREATE INDEX "SearchRankingScore_computedAt_idx" ON "SearchRankingScore"("computedAt");

-- CreateIndex
CREATE INDEX "DemandForecast_region_forecastDate_idx" ON "DemandForecast"("region", "forecastDate");

-- CreateIndex
CREATE INDEX "DemandForecast_forecastDate_idx" ON "DemandForecast"("forecastDate");

-- CreateIndex
CREATE INDEX "AiAlert_alertType_idx" ON "AiAlert"("alertType");

-- CreateIndex
CREATE INDEX "AiAlert_severity_idx" ON "AiAlert"("severity");

-- CreateIndex
CREATE INDEX "AiAlert_createdAt_idx" ON "AiAlert"("createdAt");

-- CreateIndex
CREATE INDEX "AiDecisionLog_modelId_idx" ON "AiDecisionLog"("modelId");

-- CreateIndex
CREATE INDEX "AiDecisionLog_entityType_entityId_idx" ON "AiDecisionLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AiDecisionLog_createdAt_idx" ON "AiDecisionLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiOperatorDecision_agentType_idx" ON "AiOperatorDecision"("agentType");

-- CreateIndex
CREATE INDEX "AiOperatorDecision_entityType_entityId_idx" ON "AiOperatorDecision"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AiOperatorDecision_createdAt_idx" ON "AiOperatorDecision"("createdAt");

-- CreateIndex
CREATE INDEX "AiOperatorAlert_alertType_idx" ON "AiOperatorAlert"("alertType");

-- CreateIndex
CREATE INDEX "AiOperatorAlert_status_idx" ON "AiOperatorAlert"("status");

-- CreateIndex
CREATE INDEX "AiOperatorAlert_createdAt_idx" ON "AiOperatorAlert"("createdAt");

-- CreateIndex
CREATE INDEX "ai_logs_action_idx" ON "ai_logs"("action");

-- CreateIndex
CREATE INDEX "ai_logs_entity_type_entity_id_idx" ON "ai_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_logs_created_at_idx" ON "ai_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_user_id_created_at_idx" ON "ai_interaction_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_hub_created_at_idx" ON "ai_interaction_logs"("hub", "created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_created_at_idx" ON "ai_interaction_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_legal_context_created_at_idx" ON "ai_interaction_logs"("legal_context", "created_at");

-- CreateIndex
CREATE INDEX "admin_report_snapshots_period_type_generated_at_idx" ON "admin_report_snapshots"("period_type", "generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_report_snapshots_period_type_period_start_key" ON "admin_report_snapshots"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "ai_queue_items_type_idx" ON "ai_queue_items"("type");

-- CreateIndex
CREATE INDEX "ai_queue_items_status_idx" ON "ai_queue_items"("status");

-- CreateIndex
CREATE INDEX "ai_queue_items_created_at_idx" ON "ai_queue_items"("created_at");

-- CreateIndex
CREATE INDEX "listing_design_references_listing_id_idx" ON "listing_design_references"("listing_id");

-- CreateIndex
CREATE INDEX "listing_design_references_created_at_idx" ON "listing_design_references"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "design_studio_trials_user_id_key" ON "design_studio_trials"("user_id");

-- CreateIndex
CREATE INDEX "design_studio_trials_trial_ends_at_idx" ON "design_studio_trials"("trial_ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "design_access_user_id_key" ON "design_access"("user_id");

-- CreateIndex
CREATE INDEX "design_access_user_id_idx" ON "design_access"("user_id");

-- CreateIndex
CREATE INDEX "design_access_trial_end_idx" ON "design_access"("trial_end");

-- CreateIndex
CREATE INDEX "canva_design_usages_user_id_idx" ON "canva_design_usages"("user_id");

-- CreateIndex
CREATE INDEX "canva_design_usages_listing_id_idx" ON "canva_design_usages"("listing_id");

-- CreateIndex
CREATE INDEX "canva_design_usages_trial_ends_at_idx" ON "canva_design_usages"("trial_ends_at");

-- CreateIndex
CREATE INDEX "canva_design_usages_is_paid_idx" ON "canva_design_usages"("is_paid");

-- CreateIndex
CREATE UNIQUE INDEX "canva_invoices_invoice_number_key" ON "canva_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "canva_invoices_user_id_idx" ON "canva_invoices"("user_id");

-- CreateIndex
CREATE INDEX "canva_invoices_usage_id_idx" ON "canva_invoices"("usage_id");

-- CreateIndex
CREATE INDEX "canva_invoices_created_at_idx" ON "canva_invoices"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "upgrade_invoices_stripe_payment_id_key" ON "upgrade_invoices"("stripe_payment_id");

-- CreateIndex
CREATE INDEX "upgrade_invoices_user_id_idx" ON "upgrade_invoices"("user_id");

-- CreateIndex
CREATE INDEX "upgrade_invoices_date_idx" ON "upgrade_invoices"("date");

-- CreateIndex
CREATE INDEX "billing_audit_logs_user_id_idx" ON "billing_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "billing_audit_logs_event_idx" ON "billing_audit_logs"("event");

-- CreateIndex
CREATE INDEX "billing_audit_logs_created_at_idx" ON "billing_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_storage_user_id_key" ON "user_storage"("user_id");

-- CreateIndex
CREATE INDEX "user_storage_user_id_idx" ON "user_storage"("user_id");

-- CreateIndex
CREATE INDEX "design_assets_user_id_idx" ON "design_assets"("user_id");

-- CreateIndex
CREATE INDEX "design_assets_listing_id_idx" ON "design_assets"("listing_id");

-- CreateIndex
CREATE INDEX "storage_file_records_user_id_idx" ON "storage_file_records"("user_id");

-- CreateIndex
CREATE INDEX "storage_file_records_listing_id_idx" ON "storage_file_records"("listing_id");

-- CreateIndex
CREATE INDEX "storage_file_records_entity_type_idx" ON "storage_file_records"("entity_type");

-- CreateIndex
CREATE INDEX "storage_file_records_deleted_at_idx" ON "storage_file_records"("deleted_at");

-- CreateIndex
CREATE INDEX "storage_file_records_retention_policy_idx" ON "storage_file_records"("retention_policy");

-- CreateIndex
CREATE INDEX "storage_file_records_created_at_idx" ON "storage_file_records"("created_at");

-- CreateIndex
CREATE INDEX "storage_audit_logs_action_idx" ON "storage_audit_logs"("action");

-- CreateIndex
CREATE INDEX "storage_audit_logs_user_id_idx" ON "storage_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "storage_audit_logs_created_at_idx" ON "storage_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "legal_documents_type_idx" ON "legal_documents"("type");

-- CreateIndex
CREATE INDEX "legal_documents_type_is_active_idx" ON "legal_documents"("type", "is_active");

-- CreateIndex
CREATE INDEX "corporate_legal_documents_type_idx" ON "corporate_legal_documents"("type");

-- CreateIndex
CREATE INDEX "corporate_legal_documents_status_idx" ON "corporate_legal_documents"("status");

-- CreateIndex
CREATE INDEX "company_structures_jurisdiction_idx" ON "company_structures"("jurisdiction");

-- CreateIndex
CREATE INDEX "user_agreements_user_id_idx" ON "user_agreements"("user_id");

-- CreateIndex
CREATE INDEX "user_agreements_user_id_document_type_idx" ON "user_agreements"("user_id", "document_type");

-- CreateIndex
CREATE INDEX "user_agreements_document_type_idx" ON "user_agreements"("document_type");

-- CreateIndex
CREATE INDEX "legal_form_signatures_user_id_form_key_idx" ON "legal_form_signatures"("user_id", "form_key");

-- CreateIndex
CREATE INDEX "legal_form_signatures_context_type_context_id_idx" ON "legal_form_signatures"("context_type", "context_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_form_signatures_user_id_form_key_context_type_context_key" ON "legal_form_signatures"("user_id", "form_key", "context_type", "context_id");

-- CreateIndex
CREATE INDEX "platform_agreements_agreement_type_idx" ON "platform_agreements"("agreement_type");

-- CreateIndex
CREATE INDEX "platform_agreements_related_entity_type_related_entity_id_idx" ON "platform_agreements"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE INDEX "platform_agreements_accepted_at_idx" ON "platform_agreements"("accepted_at");

-- CreateIndex
CREATE INDEX "contracts_user_id_idx" ON "contracts"("user_id");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_idx" ON "contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "contracts_type_idx" ON "contracts"("type");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_hub_idx" ON "contracts"("hub");

-- CreateIndex
CREATE INDEX "contracts_booking_id_idx" ON "contracts"("booking_id");

-- CreateIndex
CREATE INDEX "contracts_deal_id_idx" ON "contracts"("deal_id");

-- CreateIndex
CREATE INDEX "contracts_fsbo_listing_id_idx" ON "contracts"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "contracts_listing_id_idx" ON "contracts"("listing_id");

-- CreateIndex
CREATE INDEX "contracts_created_by_id_idx" ON "contracts"("created_by_id");

-- CreateIndex
CREATE INDEX "contracts_is_signed_idx" ON "contracts"("is_signed");

-- CreateIndex
CREATE INDEX "legal_contract_audit_logs_contract_id_idx" ON "legal_contract_audit_logs"("contract_id");

-- CreateIndex
CREATE INDEX "legal_contract_audit_logs_user_id_idx" ON "legal_contract_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "legal_contract_audit_logs_created_at_idx" ON "legal_contract_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "platform_commission_records_lead_id_idx" ON "platform_commission_records"("lead_id");

-- CreateIndex
CREATE INDEX "platform_commission_records_deal_id_idx" ON "platform_commission_records"("deal_id");

-- CreateIndex
CREATE INDEX "platform_commission_records_booking_id_idx" ON "platform_commission_records"("booking_id");

-- CreateIndex
CREATE INDEX "platform_commission_records_contract_id_idx" ON "platform_commission_records"("contract_id");

-- CreateIndex
CREATE INDEX "platform_commission_records_commission_source_idx" ON "platform_commission_records"("commission_source");

-- CreateIndex
CREATE UNIQUE INDEX "platform_legal_disputes_dispute_code_key" ON "platform_legal_disputes"("dispute_code");

-- CreateIndex
CREATE INDEX "platform_legal_disputes_type_idx" ON "platform_legal_disputes"("type");

-- CreateIndex
CREATE INDEX "platform_legal_disputes_status_idx" ON "platform_legal_disputes"("status");

-- CreateIndex
CREATE INDEX "platform_legal_disputes_opened_by_user_id_idx" ON "platform_legal_disputes"("opened_by_user_id");

-- CreateIndex
CREATE INDEX "platform_legal_disputes_booking_id_idx" ON "platform_legal_disputes"("booking_id");

-- CreateIndex
CREATE INDEX "platform_legal_disputes_deal_id_idx" ON "platform_legal_disputes"("deal_id");

-- CreateIndex
CREATE INDEX "platform_legal_disputes_lead_id_idx" ON "platform_legal_disputes"("lead_id");

-- CreateIndex
CREATE INDEX "contract_signatures_contract_id_idx" ON "contract_signatures"("contract_id");

-- CreateIndex
CREATE INDEX "contract_signatures_tenant_id_idx" ON "contract_signatures"("tenant_id");

-- CreateIndex
CREATE INDEX "contract_signatures_user_id_idx" ON "contract_signatures"("user_id");

-- CreateIndex
CREATE INDEX "contract_signatures_email_idx" ON "contract_signatures"("email");

-- CreateIndex
CREATE UNIQUE INDEX "offer_documents_contract_id_key" ON "offer_documents"("contract_id");

-- CreateIndex
CREATE INDEX "offer_documents_listing_id_idx" ON "offer_documents"("listing_id");

-- CreateIndex
CREATE INDEX "offer_documents_lead_id_idx" ON "offer_documents"("lead_id");

-- CreateIndex
CREATE INDEX "offer_documents_created_by_id_idx" ON "offer_documents"("created_by_id");

-- CreateIndex
CREATE INDEX "offer_documents_status_idx" ON "offer_documents"("status");

-- CreateIndex
CREATE INDEX "offer_documents_type_idx" ON "offer_documents"("type");

-- CreateIndex
CREATE INDEX "broker_transaction_records_broker_id_idx" ON "broker_transaction_records"("broker_id");

-- CreateIndex
CREATE INDEX "broker_transaction_records_outcome_idx" ON "broker_transaction_records"("outcome");

-- CreateIndex
CREATE INDEX "broker_transaction_records_lead_id_idx" ON "broker_transaction_records"("lead_id");

-- CreateIndex
CREATE INDEX "broker_transaction_records_transaction_type_idx" ON "broker_transaction_records"("transaction_type");

-- CreateIndex
CREATE INDEX "broker_expenses_broker_id_idx" ON "broker_expenses"("broker_id");

-- CreateIndex
CREATE INDEX "broker_expenses_transaction_record_id_idx" ON "broker_expenses"("transaction_record_id");

-- CreateIndex
CREATE INDEX "tax_report_snapshots_period_start_idx" ON "tax_report_snapshots"("period_start");

-- CreateIndex
CREATE INDEX "tax_report_snapshots_period_end_idx" ON "tax_report_snapshots"("period_end");

-- CreateIndex
CREATE INDEX "accounting_entries_entry_type_idx" ON "accounting_entries"("entry_type");

-- CreateIndex
CREATE INDEX "accounting_entries_category_idx" ON "accounting_entries"("category");

-- CreateIndex
CREATE INDEX "accounting_entries_entry_date_idx" ON "accounting_entries"("entry_date");

-- CreateIndex
CREATE INDEX "accounting_entries_status_idx" ON "accounting_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_records_accounting_entry_id_key" ON "reconciliation_records"("accounting_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "welcome_tax_municipality_configs_slug_key" ON "welcome_tax_municipality_configs"("slug");

-- CreateIndex
CREATE INDEX "incentive_program_configs_active_idx" ON "incentive_program_configs"("active");

-- CreateIndex
CREATE INDEX "tool_usage_events_tool_key_idx" ON "tool_usage_events"("tool_key");

-- CreateIndex
CREATE INDEX "tool_usage_events_created_at_idx" ON "tool_usage_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "property_comparisons_user_id_key" ON "property_comparisons"("user_id");

-- CreateIndex
CREATE INDEX "investor_profiles_user_id_idx" ON "investor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_scenarios_share_token_key" ON "portfolio_scenarios"("share_token");

-- CreateIndex
CREATE INDEX "portfolio_scenarios_user_id_idx" ON "portfolio_scenarios"("user_id");

-- CreateIndex
CREATE INDEX "portfolio_scenarios_investor_profile_id_idx" ON "portfolio_scenarios"("investor_profile_id");

-- CreateIndex
CREATE INDEX "portfolio_scenario_items_scenario_id_idx" ON "portfolio_scenario_items"("scenario_id");

-- CreateIndex
CREATE INDEX "portfolio_scenario_items_listing_id_idx" ON "portfolio_scenario_items"("listing_id");

-- CreateIndex
CREATE INDEX "investor_portfolio_alerts_user_id_idx" ON "investor_portfolio_alerts"("user_id");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_listing_id_idx" ON "reports"("listing_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "legal_agreements_user_id_idx" ON "legal_agreements"("user_id");

-- CreateIndex
CREATE INDEX "legal_agreements_hub_idx" ON "legal_agreements"("hub");

-- CreateIndex
CREATE INDEX "legal_agreements_type_idx" ON "legal_agreements"("type");

-- CreateIndex
CREATE UNIQUE INDEX "legal_agreements_user_id_hub_type_key" ON "legal_agreements"("user_id", "hub", "type");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "PolicyAcceptanceRecord_userId_idx" ON "PolicyAcceptanceRecord"("userId");

-- CreateIndex
CREATE INDEX "PolicyAcceptanceRecord_policyKey_idx" ON "PolicyAcceptanceRecord"("policyKey");

-- CreateIndex
CREATE INDEX "PolicyAcceptanceRecord_acceptedAt_idx" ON "PolicyAcceptanceRecord"("acceptedAt");

-- CreateIndex
CREATE INDEX "PolicyAcceptanceRecord_marketId_idx" ON "PolicyAcceptanceRecord"("marketId");

-- CreateIndex
CREATE INDEX "LegalEventLog_eventType_idx" ON "LegalEventLog"("eventType");

-- CreateIndex
CREATE INDEX "LegalEventLog_userId_idx" ON "LegalEventLog"("userId");

-- CreateIndex
CREATE INDEX "LegalEventLog_entityType_entityId_idx" ON "LegalEventLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "LegalEventLog_createdAt_idx" ON "LegalEventLog"("createdAt");

-- CreateIndex
CREATE INDEX "EvidenceRecord_caseType_caseId_idx" ON "EvidenceRecord"("caseType", "caseId");

-- CreateIndex
CREATE INDEX "EvidenceRecord_uploadedAt_idx" ON "EvidenceRecord"("uploadedAt");

-- CreateIndex
CREATE INDEX "EvidenceAccessLog_evidenceId_idx" ON "EvidenceAccessLog"("evidenceId");

-- CreateIndex
CREATE INDEX "EvidenceAccessLog_accessedBy_idx" ON "EvidenceAccessLog"("accessedBy");

-- CreateIndex
CREATE INDEX "EvidenceAccessLog_createdAt_idx" ON "EvidenceAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AbuseSignal_userId_idx" ON "AbuseSignal"("userId");

-- CreateIndex
CREATE INDEX "AbuseSignal_signalType_idx" ON "AbuseSignal"("signalType");

-- CreateIndex
CREATE INDEX "AbuseSignal_createdAt_idx" ON "AbuseSignal"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OffenderProfile_userId_key" ON "OffenderProfile"("userId");

-- CreateIndex
CREATE INDEX "OffenderProfile_userId_idx" ON "OffenderProfile"("userId");

-- CreateIndex
CREATE INDEX "PrivilegedAdminAction_adminId_idx" ON "PrivilegedAdminAction"("adminId");

-- CreateIndex
CREATE INDEX "PrivilegedAdminAction_actionType_idx" ON "PrivilegedAdminAction"("actionType");

-- CreateIndex
CREATE INDEX "PrivilegedAdminAction_createdAt_idx" ON "PrivilegedAdminAction"("createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedBy_idx" ON "ApprovalRequest"("requestedBy");

-- CreateIndex
CREATE INDEX "ApprovalRequest_createdAt_idx" ON "ApprovalRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CrisisEvent_status_idx" ON "CrisisEvent"("status");

-- CreateIndex
CREATE INDEX "CrisisEvent_severity_idx" ON "CrisisEvent"("severity");

-- CreateIndex
CREATE INDEX "CrisisEvent_startedAt_idx" ON "CrisisEvent"("startedAt");

-- CreateIndex
CREATE INDEX "CrisisActionLog_crisisId_idx" ON "CrisisActionLog"("crisisId");

-- CreateIndex
CREATE INDEX "CrisisActionLog_createdAt_idx" ON "CrisisActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_marketId_idx" ON "ComplianceRequirement"("marketId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_requirementKey_idx" ON "ComplianceRequirement"("requirementKey");

-- CreateIndex
CREATE INDEX "ComplianceReview_entityType_entityId_idx" ON "ComplianceReview"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ComplianceReview_marketId_idx" ON "ComplianceReview"("marketId");

-- CreateIndex
CREATE INDEX "ComplianceReview_status_idx" ON "ComplianceReview"("status");

-- CreateIndex
CREATE INDEX "FinancialRiskFlag_entityType_entityId_idx" ON "FinancialRiskFlag"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FinancialRiskFlag_flagType_idx" ON "FinancialRiskFlag"("flagType");

-- CreateIndex
CREATE INDEX "FinancialRiskFlag_status_idx" ON "FinancialRiskFlag"("status");

-- CreateIndex
CREATE INDEX "EnforcementAction_userId_idx" ON "EnforcementAction"("userId");

-- CreateIndex
CREATE INDEX "EnforcementAction_actionType_idx" ON "EnforcementAction"("actionType");

-- CreateIndex
CREATE INDEX "EnforcementAction_effectiveAt_idx" ON "EnforcementAction"("effectiveAt");

-- CreateIndex
CREATE INDEX "EnforcementAction_reasonCode_idx" ON "EnforcementAction"("reasonCode");

-- CreateIndex
CREATE INDEX "Appeal_userId_idx" ON "Appeal"("userId");

-- CreateIndex
CREATE INDEX "Appeal_status_idx" ON "Appeal"("status");

-- CreateIndex
CREATE INDEX "Appeal_submittedAt_idx" ON "Appeal"("submittedAt");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_reporter_id_idx" ON "trust_safety_incidents"("reporter_id");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_accused_user_id_idx" ON "trust_safety_incidents"("accused_user_id");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_listing_id_idx" ON "trust_safety_incidents"("listing_id");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_booking_id_idx" ON "trust_safety_incidents"("booking_id");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_status_idx" ON "trust_safety_incidents"("status");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_severity_level_idx" ON "trust_safety_incidents"("severity_level");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_incident_category_idx" ON "trust_safety_incidents"("incident_category");

-- CreateIndex
CREATE INDEX "trust_safety_incidents_created_at_idx" ON "trust_safety_incidents"("created_at");

-- CreateIndex
CREATE INDEX "trust_safety_evidence_incident_id_idx" ON "trust_safety_evidence"("incident_id");

-- CreateIndex
CREATE INDEX "trust_safety_actions_incident_id_idx" ON "trust_safety_actions"("incident_id");

-- CreateIndex
CREATE INDEX "trust_safety_actions_action_type_idx" ON "trust_safety_actions"("action_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_safety_profiles_user_id_key" ON "user_safety_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_safety_profiles_listing_id_key" ON "listing_safety_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "trust_safety_appeals_incident_id_idx" ON "trust_safety_appeals"("incident_id");

-- CreateIndex
CREATE INDEX "trust_safety_appeals_submitted_by_idx" ON "trust_safety_appeals"("submitted_by");

-- CreateIndex
CREATE INDEX "trust_safety_appeals_status_idx" ON "trust_safety_appeals"("status");

-- CreateIndex
CREATE INDEX "trust_safety_incident_responses_incident_id_idx" ON "trust_safety_incident_responses"("incident_id");

-- CreateIndex
CREATE INDEX "DefenseMetricsSnapshot_date_idx" ON "DefenseMetricsSnapshot"("date");

-- CreateIndex
CREATE INDEX "DefenseMetricsSnapshot_marketId_idx" ON "DefenseMetricsSnapshot"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_listing_code_key" ON "Listing"("listing_code");

-- CreateIndex
CREATE INDEX "Listing_owner_id_idx" ON "Listing"("owner_id");

-- CreateIndex
CREATE INDEX "Listing_tenant_id_idx" ON "Listing"("tenant_id");

-- CreateIndex
CREATE INDEX "broker_listing_access_broker_id_idx" ON "broker_listing_access"("broker_id");

-- CreateIndex
CREATE INDEX "broker_listing_access_listing_id_idx" ON "broker_listing_access"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_listing_access_listing_id_broker_id_key" ON "broker_listing_access"("listing_id", "broker_id");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_platform_conversation_id_key" ON "Lead"("platform_conversation_id");

-- CreateIndex
CREATE INDEX "Lead_listingId_idx" ON "Lead"("listingId");

-- CreateIndex
CREATE INDEX "Lead_fsbo_listing_id_idx" ON "Lead"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "Lead_listing_code_idx" ON "Lead"("listing_code");

-- CreateIndex
CREATE INDEX "Lead_projectId_idx" ON "Lead"("projectId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_introduced_by_broker_id_idx" ON "Lead"("introduced_by_broker_id");

-- CreateIndex
CREATE INDEX "Lead_workspace_id_idx" ON "Lead"("workspace_id");

-- CreateIndex
CREATE INDEX "Lead_last_follow_up_by_broker_id_idx" ON "Lead"("last_follow_up_by_broker_id");

-- CreateIndex
CREATE INDEX "Lead_user_id_idx" ON "Lead"("user_id");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_campaign_idx" ON "Lead"("campaign");

-- CreateIndex
CREATE INDEX "Lead_lead_source_idx" ON "Lead"("lead_source");

-- CreateIndex
CREATE INDEX "Lead_ai_tier_idx" ON "Lead"("ai_tier");

-- CreateIndex
CREATE INDEX "Lead_pipeline_status_idx" ON "Lead"("pipeline_status");

-- CreateIndex
CREATE INDEX "Lead_pipeline_stage_idx" ON "Lead"("pipeline_stage");

-- CreateIndex
CREATE INDEX "Lead_next_follow_up_at_idx" ON "Lead"("next_follow_up_at");

-- CreateIndex
CREATE INDEX "Lead_next_action_at_idx" ON "Lead"("next_action_at");

-- CreateIndex
CREATE INDEX "Lead_deal_value_idx" ON "Lead"("deal_value");

-- CreateIndex
CREATE INDEX "Lead_high_intent_idx" ON "Lead"("high_intent");

-- CreateIndex
CREATE INDEX "Lead_dm_status_idx" ON "Lead"("dm_status");

-- CreateIndex
CREATE INDEX "Lead_outreach_coaching_stage_idx" ON "Lead"("outreach_coaching_stage");

-- CreateIndex
CREATE INDEX "Lead_last_dm_at_idx" ON "Lead"("last_dm_at");

-- CreateIndex
CREATE INDEX "Lead_engagement_score_idx" ON "Lead"("engagement_score");

-- CreateIndex
CREATE INDEX "Lead_lecipm_lead_score_idx" ON "Lead"("lecipm_lead_score");

-- CreateIndex
CREATE INDEX "Lead_lecipm_crm_stage_idx" ON "Lead"("lecipm_crm_stage");

-- CreateIndex
CREATE INDEX "Lead_lead_type_idx" ON "Lead"("lead_type");

-- CreateIndex
CREATE INDEX "Lead_assigned_expert_id_idx" ON "Lead"("assigned_expert_id");

-- CreateIndex
CREATE INDEX "Lead_mortgage_marketplace_status_idx" ON "Lead"("mortgage_marketplace_status");

-- CreateIndex
CREATE INDEX "Lead_revenue_tier_idx" ON "Lead"("revenue_tier");

-- CreateIndex
CREATE INDEX "Lead_purchase_region_idx" ON "Lead"("purchase_region");

-- CreateIndex
CREATE INDEX "Lead_contact_origin_idx" ON "Lead"("contact_origin");

-- CreateIndex
CREATE INDEX "Lead_short_term_listing_id_idx" ON "Lead"("short_term_listing_id");

-- CreateIndex
CREATE INDEX "Lead_crm_priority_score_crm_last_activity_at_idx" ON "Lead"("crm_priority_score", "crm_last_activity_at");

-- CreateIndex
CREATE INDEX "Lead_crm_execution_stage_idx" ON "Lead"("crm_execution_stage");

-- CreateIndex
CREATE INDEX "internal_crm_events_lead_id_created_at_idx" ON "internal_crm_events"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "internal_crm_events_user_id_created_at_idx" ON "internal_crm_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "internal_crm_events_short_term_listing_id_created_at_idx" ON "internal_crm_events"("short_term_listing_id", "created_at");

-- CreateIndex
CREATE INDEX "internal_crm_events_event_type_created_at_idx" ON "internal_crm_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "internal_crm_events_channel_created_at_idx" ON "internal_crm_events"("channel", "created_at");

-- CreateIndex
CREATE INDEX "lead_contact_audit_events_lead_id_created_at_idx" ON "lead_contact_audit_events"("lead_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_conversations_lead_id_key" ON "crm_conversations"("lead_id");

-- CreateIndex
CREATE INDEX "crm_conversations_user_id_idx" ON "crm_conversations"("user_id");

-- CreateIndex
CREATE INDEX "crm_conversations_guest_session_id_idx" ON "crm_conversations"("guest_session_id");

-- CreateIndex
CREATE INDEX "crm_conversations_expert_id_idx" ON "crm_conversations"("expert_id");

-- CreateIndex
CREATE INDEX "crm_conversations_updated_at_idx" ON "crm_conversations"("updated_at");

-- CreateIndex
CREATE INDEX "crm_conversations_convo_priority_score_convo_last_activity__idx" ON "crm_conversations"("convo_priority_score", "convo_last_activity_at");

-- CreateIndex
CREATE INDEX "crm_messages_conversation_id_created_at_idx" ON "crm_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_automation_tasks_lead_id_status_idx" ON "lead_automation_tasks"("lead_id", "status");

-- CreateIndex
CREATE INDEX "lead_automation_tasks_due_at_status_idx" ON "lead_automation_tasks"("due_at", "status");

-- CreateIndex
CREATE INDEX "lead_tasks_lead_id_status_idx" ON "lead_tasks"("lead_id", "status");

-- CreateIndex
CREATE INDEX "lead_tasks_due_at_idx" ON "lead_tasks"("due_at");

-- CreateIndex
CREATE INDEX "traffic_events_event_type_created_at_idx" ON "traffic_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "traffic_events_source_created_at_idx" ON "traffic_events"("source", "created_at");

-- CreateIndex
CREATE INDEX "traffic_events_campaign_created_at_idx" ON "traffic_events"("campaign", "created_at");

-- CreateIndex
CREATE INDEX "traffic_events_path_created_at_idx" ON "traffic_events"("path", "created_at");

-- CreateIndex
CREATE INDEX "evaluate_funnel_sessions_user_id_idx" ON "evaluate_funnel_sessions"("user_id");

-- CreateIndex
CREATE INDEX "evaluate_funnel_sessions_submitted_at_idx" ON "evaluate_funnel_sessions"("submitted_at");

-- CreateIndex
CREATE INDEX "lead_contact_consents_lead_id_created_at_idx" ON "lead_contact_consents"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_comm_messages_lead_id_created_at_idx" ON "lead_comm_messages"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_comm_messages_channel_status_idx" ON "lead_comm_messages"("channel", "status");

-- CreateIndex
CREATE INDEX "lead_timeline_events_lead_id_created_at_idx" ON "lead_timeline_events"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_follow_up_jobs_status_scheduled_for_idx" ON "lead_follow_up_jobs"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "lead_follow_up_jobs_lead_id_idx" ON "lead_follow_up_jobs"("lead_id");

-- CreateIndex
CREATE INDEX "auto_close_audit_events_created_at_idx" ON "auto_close_audit_events"("created_at");

-- CreateIndex
CREATE INDEX "auto_close_audit_events_target_type_target_id_idx" ON "auto_close_audit_events"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_playbooks_key_key" ON "conversion_playbooks"("key");

-- CreateIndex
CREATE INDEX "conversion_playbook_steps_playbook_id_idx" ON "conversion_playbook_steps"("playbook_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_playbook_steps_playbook_id_step_order_key" ON "conversion_playbook_steps"("playbook_id", "step_order");

-- CreateIndex
CREATE INDEX "conversion_playbook_executions_user_id_idx" ON "conversion_playbook_executions"("user_id");

-- CreateIndex
CREATE INDEX "conversion_playbook_executions_playbook_id_idx" ON "conversion_playbook_executions"("playbook_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_playbook_executions_lead_id_playbook_id_key" ON "conversion_playbook_executions"("lead_id", "playbook_id");

-- CreateIndex
CREATE INDEX "crm_interactions_lead_id_idx" ON "crm_interactions"("lead_id");

-- CreateIndex
CREATE INDEX "crm_interactions_deal_id_idx" ON "crm_interactions"("deal_id");

-- CreateIndex
CREATE INDEX "crm_interactions_broker_id_created_at_idx" ON "crm_interactions"("broker_id", "created_at");

-- CreateIndex
CREATE INDEX "client_retention_touchpoints_broker_id_scheduled_for_status_idx" ON "client_retention_touchpoints"("broker_id", "scheduled_for", "status");

-- CreateIndex
CREATE INDEX "client_retention_touchpoints_lead_id_idx" ON "client_retention_touchpoints"("lead_id");

-- CreateIndex
CREATE INDEX "ai_user_activity_logs_user_id_created_at_idx" ON "ai_user_activity_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_user_activity_logs_event_type_idx" ON "ai_user_activity_logs"("event_type");

-- CreateIndex
CREATE INDEX "ai_recommendation_history_user_id_idx" ON "ai_recommendation_history"("user_id");

-- CreateIndex
CREATE INDEX "ai_recommendation_history_listing_id_idx" ON "ai_recommendation_history"("listing_id");

-- CreateIndex
CREATE INDEX "ai_marketing_content_content_type_idx" ON "ai_marketing_content"("content_type");

-- CreateIndex
CREATE INDEX "viral_short_script_records_created_by_id_idx" ON "viral_short_script_records"("created_by_id");

-- CreateIndex
CREATE INDEX "viral_short_script_records_hook_type_idx" ON "viral_short_script_records"("hook_type");

-- CreateIndex
CREATE INDEX "viral_short_script_records_content_type_idx" ON "viral_short_script_records"("content_type");

-- CreateIndex
CREATE INDEX "viral_short_script_records_created_at_idx" ON "viral_short_script_records"("created_at");

-- CreateIndex
CREATE INDEX "ai_automation_events_user_id_idx" ON "ai_automation_events"("user_id");

-- CreateIndex
CREATE INDEX "ai_automation_events_broker_id_idx" ON "ai_automation_events"("broker_id");

-- CreateIndex
CREATE INDEX "ai_automation_events_event_key_idx" ON "ai_automation_events"("event_key");

-- CreateIndex
CREATE INDEX "ai_client_chat_sessions_listing_id_idx" ON "ai_client_chat_sessions"("listing_id");

-- CreateIndex
CREATE INDEX "ai_client_chat_sessions_lead_id_idx" ON "ai_client_chat_sessions"("lead_id");

-- CreateIndex
CREATE INDEX "ai_client_chat_sessions_created_at_idx" ON "ai_client_chat_sessions"("created_at");

-- CreateIndex
CREATE INDEX "lead_follow_ups_lead_id_idx" ON "lead_follow_ups"("lead_id");

-- CreateIndex
CREATE INDEX "lead_follow_ups_broker_id_idx" ON "lead_follow_ups"("broker_id");

-- CreateIndex
CREATE INDEX "broker_conversations_broker1_id_idx" ON "broker_conversations"("broker1_id");

-- CreateIndex
CREATE INDEX "broker_conversations_broker2_id_idx" ON "broker_conversations"("broker2_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_conversations_broker1_id_broker2_id_key" ON "broker_conversations"("broker1_id", "broker2_id");

-- CreateIndex
CREATE INDEX "broker_conversation_messages_conversation_id_idx" ON "broker_conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "broker_conversation_messages_sender_id_idx" ON "broker_conversation_messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubscription_projectId_key" ON "ProjectSubscription"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSubscription_projectId_idx" ON "ProjectSubscription"("projectId");

-- CreateIndex
CREATE INDEX "ProjectLeadPayment_projectId_idx" ON "ProjectLeadPayment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectLeadPayment_leadId_idx" ON "ProjectLeadPayment"("leadId");

-- CreateIndex
CREATE INDEX "ProjectUnit_projectId_idx" ON "ProjectUnit"("projectId");

-- CreateIndex
CREATE INDEX "ProjectUnit_status_idx" ON "ProjectUnit"("status");

-- CreateIndex
CREATE INDEX "FavoriteProject_userId_idx" ON "FavoriteProject"("userId");

-- CreateIndex
CREATE INDEX "FavoriteProject_projectId_idx" ON "FavoriteProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteProject_userId_projectId_key" ON "FavoriteProject"("userId", "projectId");

-- CreateIndex
CREATE INDEX "SavedProjectSearch_userId_idx" ON "SavedProjectSearch"("userId");

-- CreateIndex
CREATE INDEX "ProjectAlert_userId_idx" ON "ProjectAlert"("userId");

-- CreateIndex
CREATE INDEX "ProjectAlert_isActive_idx" ON "ProjectAlert"("isActive");

-- CreateIndex
CREATE INDEX "ProjectReservation_projectId_idx" ON "ProjectReservation"("projectId");

-- CreateIndex
CREATE INDEX "ProjectReservation_userId_idx" ON "ProjectReservation"("userId");

-- CreateIndex
CREATE INDEX "ProjectReservation_status_idx" ON "ProjectReservation"("status");

-- CreateIndex
CREATE INDEX "BuyerProfile_userId_idx" ON "BuyerProfile"("userId");

-- CreateIndex
CREATE INDEX "BuyerProfile_cityPreference_idx" ON "BuyerProfile"("cityPreference");

-- CreateIndex
CREATE INDEX "InvestorPortfolio_userId_idx" ON "InvestorPortfolio"("userId");

-- CreateIndex
CREATE INDEX "InvestorPortfolio_projectId_idx" ON "InvestorPortfolio"("projectId");

-- CreateIndex
CREATE INDEX "investment_deals_user_id_idx" ON "investment_deals"("user_id");

-- CreateIndex
CREATE INDEX "shared_deal_visits_deal_id_created_at_idx" ON "shared_deal_visits"("deal_id", "created_at");

-- CreateIndex
CREATE INDEX "shared_deal_visits_created_at_idx" ON "shared_deal_visits"("created_at");

-- CreateIndex
CREATE INDEX "shared_deal_visits_referrer_user_id_idx" ON "shared_deal_visits"("referrer_user_id");

-- CreateIndex
CREATE INDEX "early_access_subscribers_created_at_idx" ON "early_access_subscribers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "early_access_subscribers_email_key" ON "early_access_subscribers"("email");

-- CreateIndex
CREATE INDEX "early_users_tracking_type_status_idx" ON "early_users_tracking"("type", "status");

-- CreateIndex
CREATE INDEX "early_users_tracking_status_idx" ON "early_users_tracking"("status");

-- CreateIndex
CREATE INDEX "early_users_tracking_source_idx" ON "early_users_tracking"("source");

-- CreateIndex
CREATE INDEX "early_users_tracking_follow_up_at_idx" ON "early_users_tracking"("follow_up_at");

-- CreateIndex
CREATE INDEX "early_users_tracking_lead_tier_idx" ON "early_users_tracking"("lead_tier");

-- CreateIndex
CREATE INDEX "early_users_tracking_created_at_idx" ON "early_users_tracking"("created_at");

-- CreateIndex
CREATE INDEX "growth_lead_captures_email_idx" ON "growth_lead_captures"("email");

-- CreateIndex
CREATE INDEX "growth_lead_captures_intent_created_at_idx" ON "growth_lead_captures"("intent", "created_at");

-- CreateIndex
CREATE INDEX "growth_lead_captures_created_at_idx" ON "growth_lead_captures"("created_at");

-- CreateIndex
CREATE INDEX "enterprise_leads_stage_idx" ON "enterprise_leads"("stage");

-- CreateIndex
CREATE INDEX "enterprise_leads_segment_idx" ON "enterprise_leads"("segment");

-- CreateIndex
CREATE INDEX "enterprise_leads_follow_up_at_idx" ON "enterprise_leads"("follow_up_at");

-- CreateIndex
CREATE INDEX "enterprise_leads_created_at_idx" ON "enterprise_leads"("created_at");

-- CreateIndex
CREATE INDEX "product_feedback_created_at_idx" ON "product_feedback"("created_at");

-- CreateIndex
CREATE INDEX "waitlist_users_created_at_idx" ON "waitlist_users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_users_email_key" ON "waitlist_users"("email");

-- CreateIndex
CREATE INDEX "user_events_eventType_created_at_idx" ON "user_events"("eventType", "created_at");

-- CreateIndex
CREATE INDEX "user_events_created_at_idx" ON "user_events"("created_at");

-- CreateIndex
CREATE INDEX "user_events_user_id_created_at_idx" ON "user_events"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "growth_stripe_webhook_logs_stripe_event_id_key" ON "growth_stripe_webhook_logs"("stripe_event_id");

-- CreateIndex
CREATE INDEX "growth_stripe_webhook_logs_event_type_created_at_idx" ON "growth_stripe_webhook_logs"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "growth_email_queue_status_scheduled_at_idx" ON "growth_email_queue"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "growth_email_queue_user_id_idx" ON "growth_email_queue"("user_id");

-- CreateIndex
CREATE INDEX "message_templates_segment_type_idx" ON "message_templates"("segment", "type");

-- CreateIndex
CREATE INDEX "message_logs_user_id_sent_at_idx" ON "message_logs"("user_id", "sent_at");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_user_id_status_idx" ON "growth_ai_conversations"("user_id", "status");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_status_ai_reply_pending_idx" ON "growth_ai_conversations"("status", "ai_reply_pending");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_assigned_to_id_idx" ON "growth_ai_conversations"("assigned_to_id");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_growth_ai_outcome_idx" ON "growth_ai_conversations"("growth_ai_outcome");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_outcome_idx" ON "growth_ai_conversations"("outcome");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_high_intent_idx" ON "growth_ai_conversations"("high_intent");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_stage_idx" ON "growth_ai_conversations"("stage");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_last_user_message_at_idx" ON "growth_ai_conversations"("last_user_message_at");

-- CreateIndex
CREATE INDEX "growth_ai_conversations_silent_nudge_sent_at_idx" ON "growth_ai_conversations"("silent_nudge_sent_at");

-- CreateIndex
CREATE INDEX "growth_ai_conversation_messages_conversation_id_created_at_idx" ON "growth_ai_conversation_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "deal_assistant_insights_conversation_id_created_at_idx" ON "deal_assistant_insights"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "auto_reply_rules_intent_objection_is_active_idx" ON "auto_reply_rules"("intent", "objection", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "auto_reply_templates_template_key_key" ON "auto_reply_templates"("template_key");

-- CreateIndex
CREATE INDEX "growth_ai_conversation_handoffs_conversation_id_status_idx" ON "growth_ai_conversation_handoffs"("conversation_id", "status");

-- CreateIndex
CREATE INDEX "growth_ai_template_performance_template_key_idx" ON "growth_ai_template_performance"("template_key");

-- CreateIndex
CREATE INDEX "growth_ai_template_performance_stage_detected_intent_detect_idx" ON "growth_ai_template_performance"("stage", "detected_intent", "detected_objection");

-- CreateIndex
CREATE INDEX "growth_ai_template_performance_high_intent_idx" ON "growth_ai_template_performance"("high_intent");

-- CreateIndex
CREATE UNIQUE INDEX "growth_ai_template_performance_template_key_stage_detected__key" ON "growth_ai_template_performance"("template_key", "stage", "detected_intent", "detected_objection", "high_intent");

-- CreateIndex
CREATE UNIQUE INDEX "growth_ai_routing_experiments_experiment_key_key" ON "growth_ai_routing_experiments"("experiment_key");

-- CreateIndex
CREATE INDEX "growth_ai_routing_experiments_is_active_idx" ON "growth_ai_routing_experiments"("is_active");

-- CreateIndex
CREATE INDEX "growth_ai_conversation_decisions_conversation_id_idx" ON "growth_ai_conversation_decisions"("conversation_id");

-- CreateIndex
CREATE INDEX "growth_ai_conversation_decisions_selected_template_key_idx" ON "growth_ai_conversation_decisions"("selected_template_key");

-- CreateIndex
CREATE INDEX "growth_ai_conversation_decisions_experiment_key_idx" ON "growth_ai_conversation_decisions"("experiment_key");

-- CreateIndex
CREATE INDEX "growth_ai_template_outcome_events_conversation_id_idx" ON "growth_ai_template_outcome_events"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "growth_ai_template_outcome_events_conversation_id_event_key_key" ON "growth_ai_template_outcome_events"("conversation_id", "event_key");

-- CreateIndex
CREATE INDEX "growth_ai_learning_manual_overrides_is_active_idx" ON "growth_ai_learning_manual_overrides"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "growth_ai_learning_manual_overrides_stage_detected_intent_d_key" ON "growth_ai_learning_manual_overrides"("stage", "detected_intent", "detected_objection", "high_intent");

-- CreateIndex
CREATE UNIQUE INDEX "growth_ai_lead_orchestrations_conversation_id_key" ON "growth_ai_lead_orchestrations"("conversation_id");

-- CreateIndex
CREATE INDEX "growth_ai_lead_orchestrations_conversation_id_idx" ON "growth_ai_lead_orchestrations"("conversation_id");

-- CreateIndex
CREATE INDEX "growth_ai_lead_orchestrations_assignment_status_next_action_idx" ON "growth_ai_lead_orchestrations"("assignment_status", "next_action_due_at");

-- CreateIndex
CREATE INDEX "growth_ai_lead_orchestrations_assigned_broker_id_idx" ON "growth_ai_lead_orchestrations"("assigned_broker_id");

-- CreateIndex
CREATE INDEX "growth_ai_lead_orchestrations_assigned_host_id_idx" ON "growth_ai_lead_orchestrations"("assigned_host_id");

-- CreateIndex
CREATE INDEX "growth_ai_action_logs_orchestration_id_idx" ON "growth_ai_action_logs"("orchestration_id");

-- CreateIndex
CREATE INDEX "growth_ai_action_logs_conversation_id_idx" ON "growth_ai_action_logs"("conversation_id");

-- CreateIndex
CREATE INDEX "growth_ai_assignment_rules_route_type_is_active_idx" ON "growth_ai_assignment_rules"("route_type", "is_active");

-- CreateIndex
CREATE INDEX "executive_kpi_snapshots_snapshot_type_snapshot_date_idx" ON "executive_kpi_snapshots"("snapshot_type", "snapshot_date");

-- CreateIndex
CREATE INDEX "executive_recommendations_status_priority_score_idx" ON "executive_recommendations"("status", "priority_score");

-- CreateIndex
CREATE INDEX "executive_recommendations_recommendation_type_idx" ON "executive_recommendations"("recommendation_type");

-- CreateIndex
CREATE INDEX "executive_recommendations_target_entity_type_target_entity__idx" ON "executive_recommendations"("target_entity_type", "target_entity_id");

-- CreateIndex
CREATE INDEX "executive_action_runs_action_key_idx" ON "executive_action_runs"("action_key");

-- CreateIndex
CREATE INDEX "executive_action_runs_recommendation_id_idx" ON "executive_action_runs"("recommendation_id");

-- CreateIndex
CREATE INDEX "executive_entity_scores_entity_type_score_type_idx" ON "executive_entity_scores"("entity_type", "score_type");

-- CreateIndex
CREATE INDEX "executive_entity_scores_score_type_score_value_idx" ON "executive_entity_scores"("score_type", "score_value");

-- CreateIndex
CREATE UNIQUE INDEX "executive_entity_scores_entity_type_entity_id_score_type_key" ON "executive_entity_scores"("entity_type", "entity_id", "score_type");

-- CreateIndex
CREATE INDEX "user_feedback_created_at_idx" ON "user_feedback"("created_at");

-- CreateIndex
CREATE INDEX "user_feedback_user_id_idx" ON "user_feedback"("user_id");

-- CreateIndex
CREATE INDEX "user_feedback_rating_idx" ON "user_feedback"("rating");

-- CreateIndex
CREATE INDEX "demo_events_event_created_at_idx" ON "demo_events"("event", "created_at");

-- CreateIndex
CREATE INDEX "demo_events_created_at_idx" ON "demo_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "monopoly_expansion_cities_slug_key" ON "monopoly_expansion_cities"("slug");

-- CreateIndex
CREATE INDEX "monopoly_expansion_cities_launched_at_idx" ON "monopoly_expansion_cities"("launched_at");

-- CreateIndex
CREATE INDEX "monopoly_competitor_snapshots_city_slug_recorded_at_idx" ON "monopoly_competitor_snapshots"("city_slug", "recorded_at");

-- CreateIndex
CREATE INDEX "FormSubmission_formType_idx" ON "FormSubmission"("formType");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_createdAt_idx" ON "FormSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "FormActivity_formSubmissionId_idx" ON "FormActivity"("formSubmissionId");

-- CreateIndex
CREATE INDEX "testimonials_is_approved_featured_idx" ON "testimonials"("is_approved", "featured");

-- CreateIndex
CREATE INDEX "testimonials_created_at_idx" ON "testimonials"("created_at");

-- CreateIndex
CREATE INDEX "case_studies_is_published_featured_idx" ON "case_studies"("is_published", "featured");

-- CreateIndex
CREATE INDEX "case_studies_created_at_idx" ON "case_studies"("created_at");

-- CreateIndex
CREATE INDEX "client_acquisition_leads_owner_id_idx" ON "client_acquisition_leads"("owner_id");

-- CreateIndex
CREATE INDEX "client_acquisition_leads_owner_id_closed_idx" ON "client_acquisition_leads"("owner_id", "closed");

-- CreateIndex
CREATE INDEX "client_acquisition_leads_owner_id_created_at_idx" ON "client_acquisition_leads"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "client_acquisition_daily_progress_owner_id_idx" ON "client_acquisition_daily_progress"("owner_id");

-- CreateIndex
CREATE INDEX "client_acquisition_daily_progress_date_idx" ON "client_acquisition_daily_progress"("date");

-- CreateIndex
CREATE UNIQUE INDEX "client_acquisition_daily_progress_owner_id_date_key" ON "client_acquisition_daily_progress"("owner_id", "date");

-- CreateIndex
CREATE INDEX "launch_phase_daily_stats_date_idx" ON "launch_phase_daily_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "launch_phase_daily_stats_date_key" ON "launch_phase_daily_stats"("date");

-- CreateIndex
CREATE INDEX "spell_dictionary_entries_locale_idx" ON "spell_dictionary_entries"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "spell_dictionary_entries_word_locale_kind_key" ON "spell_dictionary_entries"("word", "locale", "kind");

-- CreateIndex
CREATE INDEX "ai_writer_usage_logs_user_id_created_at_idx" ON "ai_writer_usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_writer_usage_logs_created_at_idx" ON "ai_writer_usage_logs"("created_at");

-- CreateIndex
CREATE INDEX "platform_analytics_date_idx" ON "platform_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "platform_analytics_date_key" ON "platform_analytics"("date");

-- CreateIndex
CREATE INDEX "listing_offers_listing_id_idx" ON "listing_offers"("listing_id");

-- CreateIndex
CREATE INDEX "listing_offers_buyer_id_idx" ON "listing_offers"("buyer_id");

-- CreateIndex
CREATE INDEX "listing_offers_broker_id_idx" ON "listing_offers"("broker_id");

-- CreateIndex
CREATE INDEX "listing_offers_tenant_id_idx" ON "listing_offers"("tenant_id");

-- CreateIndex
CREATE INDEX "listing_offers_status_idx" ON "listing_offers"("status");

-- CreateIndex
CREATE INDEX "listing_offer_events_offer_id_idx" ON "listing_offer_events"("offer_id");

-- CreateIndex
CREATE INDEX "listing_offer_events_tenant_id_idx" ON "listing_offer_events"("tenant_id");

-- CreateIndex
CREATE INDEX "broker_clients_broker_id_idx" ON "broker_clients"("broker_id");

-- CreateIndex
CREATE INDEX "broker_clients_user_id_idx" ON "broker_clients"("user_id");

-- CreateIndex
CREATE INDEX "broker_clients_status_idx" ON "broker_clients"("status");

-- CreateIndex
CREATE INDEX "broker_client_interactions_broker_client_id_idx" ON "broker_client_interactions"("broker_client_id");

-- CreateIndex
CREATE INDEX "broker_client_interactions_due_at_idx" ON "broker_client_interactions"("due_at");

-- CreateIndex
CREATE INDEX "broker_client_listings_broker_client_id_idx" ON "broker_client_listings"("broker_client_id");

-- CreateIndex
CREATE INDEX "broker_client_listings_listing_id_idx" ON "broker_client_listings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_client_listings_broker_client_id_listing_id_key" ON "broker_client_listings"("broker_client_id", "listing_id");

-- CreateIndex
CREATE INDEX "availability_rules_broker_id_idx" ON "availability_rules"("broker_id");

-- CreateIndex
CREATE INDEX "availability_rules_day_of_week_idx" ON "availability_rules"("day_of_week");

-- CreateIndex
CREATE INDEX "availability_exceptions_broker_id_idx" ON "availability_exceptions"("broker_id");

-- CreateIndex
CREATE INDEX "availability_exceptions_starts_at_idx" ON "availability_exceptions"("starts_at");

-- CreateIndex
CREATE INDEX "appointments_broker_id_idx" ON "appointments"("broker_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_client_user_id_idx" ON "appointments"("client_user_id");

-- CreateIndex
CREATE INDEX "appointments_broker_client_id_idx" ON "appointments"("broker_client_id");

-- CreateIndex
CREATE INDEX "appointments_listing_id_idx" ON "appointments"("listing_id");

-- CreateIndex
CREATE INDEX "appointments_offer_id_idx" ON "appointments"("offer_id");

-- CreateIndex
CREATE INDEX "appointments_contract_id_idx" ON "appointments"("contract_id");

-- CreateIndex
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointment_events_appointment_id_idx" ON "appointment_events"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_events_tenant_id_idx" ON "appointment_events"("tenant_id");

-- CreateIndex
CREATE INDEX "conversations_listing_id_idx" ON "conversations"("listing_id");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_idx" ON "conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "conversations_offer_id_idx" ON "conversations"("offer_id");

-- CreateIndex
CREATE INDEX "conversations_contract_id_idx" ON "conversations"("contract_id");

-- CreateIndex
CREATE INDEX "conversations_appointment_id_idx" ON "conversations"("appointment_id");

-- CreateIndex
CREATE INDEX "conversations_broker_client_id_idx" ON "conversations"("broker_client_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "conversation_participants_conversation_id_idx" ON "conversation_participants"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_tenant_id_idx" ON "messages"("tenant_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "message_events_conversation_id_idx" ON "message_events"("conversation_id");

-- CreateIndex
CREATE INDEX "message_events_message_id_idx" ON "message_events"("message_id");

-- CreateIndex
CREATE INDEX "document_folders_listing_id_idx" ON "document_folders"("listing_id");

-- CreateIndex
CREATE INDEX "document_folders_broker_client_id_idx" ON "document_folders"("broker_client_id");

-- CreateIndex
CREATE INDEX "document_folders_offer_id_idx" ON "document_folders"("offer_id");

-- CreateIndex
CREATE INDEX "document_folders_contract_id_idx" ON "document_folders"("contract_id");

-- CreateIndex
CREATE INDEX "document_folders_appointment_id_idx" ON "document_folders"("appointment_id");

-- CreateIndex
CREATE INDEX "document_folders_conversation_id_idx" ON "document_folders"("conversation_id");

-- CreateIndex
CREATE INDEX "document_folders_tenant_id_idx" ON "document_folders"("tenant_id");

-- CreateIndex
CREATE INDEX "document_files_folder_id_idx" ON "document_files"("folder_id");

-- CreateIndex
CREATE INDEX "document_files_uploaded_by_id_idx" ON "document_files"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "document_files_listing_id_idx" ON "document_files"("listing_id");

-- CreateIndex
CREATE INDEX "document_files_broker_client_id_idx" ON "document_files"("broker_client_id");

-- CreateIndex
CREATE INDEX "document_files_workspace_id_idx" ON "document_files"("workspace_id");

-- CreateIndex
CREATE INDEX "document_files_offer_id_idx" ON "document_files"("offer_id");

-- CreateIndex
CREATE INDEX "document_files_contract_id_idx" ON "document_files"("contract_id");

-- CreateIndex
CREATE INDEX "document_files_appointment_id_idx" ON "document_files"("appointment_id");

-- CreateIndex
CREATE INDEX "document_files_conversation_id_idx" ON "document_files"("conversation_id");

-- CreateIndex
CREATE INDEX "document_files_visibility_idx" ON "document_files"("visibility");

-- CreateIndex
CREATE INDEX "document_files_category_idx" ON "document_files"("category");

-- CreateIndex
CREATE INDEX "document_files_tenant_id_idx" ON "document_files"("tenant_id");

-- CreateIndex
CREATE INDEX "document_access_grants_document_file_id_idx" ON "document_access_grants"("document_file_id");

-- CreateIndex
CREATE INDEX "document_access_grants_user_id_idx" ON "document_access_grants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_access_grants_document_file_id_user_id_key" ON "document_access_grants"("document_file_id", "user_id");

-- CreateIndex
CREATE INDEX "document_events_document_file_id_idx" ON "document_events"("document_file_id");

-- CreateIndex
CREATE INDEX "document_events_folder_id_idx" ON "document_events"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_intake_profiles_broker_client_id_key" ON "client_intake_profiles"("broker_client_id");

-- CreateIndex
CREATE INDEX "client_intake_profiles_user_id_idx" ON "client_intake_profiles"("user_id");

-- CreateIndex
CREATE INDEX "client_intake_profiles_tenant_id_idx" ON "client_intake_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "required_document_items_broker_client_id_idx" ON "required_document_items"("broker_client_id");

-- CreateIndex
CREATE INDEX "required_document_items_intake_profile_id_idx" ON "required_document_items"("intake_profile_id");

-- CreateIndex
CREATE INDEX "required_document_items_status_idx" ON "required_document_items"("status");

-- CreateIndex
CREATE INDEX "required_document_items_linked_document_file_id_idx" ON "required_document_items"("linked_document_file_id");

-- CreateIndex
CREATE INDEX "required_document_items_tenant_id_idx" ON "required_document_items"("tenant_id");

-- CreateIndex
CREATE INDEX "client_intake_events_broker_client_id_idx" ON "client_intake_events"("broker_client_id");

-- CreateIndex
CREATE INDEX "client_intake_events_intake_profile_id_idx" ON "client_intake_events"("intake_profile_id");

-- CreateIndex
CREATE INDEX "client_intake_events_required_document_item_id_idx" ON "client_intake_events"("required_document_item_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_offer_id_idx" ON "notifications"("offer_id");

-- CreateIndex
CREATE INDEX "notifications_contract_id_idx" ON "notifications"("contract_id");

-- CreateIndex
CREATE INDEX "notifications_appointment_id_idx" ON "notifications"("appointment_id");

-- CreateIndex
CREATE INDEX "notifications_conversation_id_idx" ON "notifications"("conversation_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "action_queue_items_user_id_idx" ON "action_queue_items"("user_id");

-- CreateIndex
CREATE INDEX "action_queue_items_status_idx" ON "action_queue_items"("status");

-- CreateIndex
CREATE INDEX "action_queue_items_priority_idx" ON "action_queue_items"("priority");

-- CreateIndex
CREATE INDEX "action_queue_items_due_at_idx" ON "action_queue_items"("due_at");

-- CreateIndex
CREATE INDEX "action_queue_items_source_type_source_id_idx" ON "action_queue_items"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "action_queue_items_tenant_id_idx" ON "action_queue_items"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_events_notification_id_idx" ON "notification_events"("notification_id");

-- CreateIndex
CREATE INDEX "notification_events_action_queue_item_id_idx" ON "notification_events"("action_queue_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_owner_user_id_idx" ON "tenants"("owner_user_id");

-- CreateIndex
CREATE INDEX "tenant_memberships_tenant_id_idx" ON "tenant_memberships"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_memberships_user_id_idx" ON "tenant_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_memberships_tenant_id_user_id_key" ON "tenant_memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "deal_financials_tenant_id_idx" ON "deal_financials"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_financials_listing_id_idx" ON "deal_financials"("listing_id");

-- CreateIndex
CREATE INDEX "deal_financials_offer_id_idx" ON "deal_financials"("offer_id");

-- CreateIndex
CREATE INDEX "deal_financials_contract_id_idx" ON "deal_financials"("contract_id");

-- CreateIndex
CREATE INDEX "commission_splits_tenant_id_idx" ON "commission_splits"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_splits_deal_financial_id_idx" ON "commission_splits"("deal_financial_id");

-- CreateIndex
CREATE INDEX "commission_splits_user_id_idx" ON "commission_splits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invoices_invoice_number_key" ON "tenant_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "tenant_invoices_tenant_id_idx" ON "tenant_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_invoices_status_idx" ON "tenant_invoices"("status");

-- CreateIndex
CREATE INDEX "tenant_invoices_due_at_idx" ON "tenant_invoices"("due_at");

-- CreateIndex
CREATE INDEX "payment_records_tenant_id_idx" ON "payment_records"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_records_tenant_invoice_id_idx" ON "payment_records"("tenant_invoice_id");

-- CreateIndex
CREATE INDEX "payment_records_deal_financial_id_idx" ON "payment_records"("deal_financial_id");

-- CreateIndex
CREATE INDEX "payment_records_status_idx" ON "payment_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_billing_profiles_tenant_id_key" ON "tenant_billing_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_leads_stage_idx" ON "crm_leads"("stage");

-- CreateIndex
CREATE INDEX "crm_leads_email_idx" ON "crm_leads"("email");

-- CreateIndex
CREATE INDEX "crm_leads_owner_user_id_idx" ON "crm_leads"("owner_user_id");

-- CreateIndex
CREATE INDEX "crm_activities_lead_id_idx" ON "crm_activities"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_fsbo_listing_id_key" ON "properties"("fsbo_listing_id");

-- CreateIndex
CREATE INDEX "idx_properties_status" ON "properties"("status");

-- CreateIndex
CREATE INDEX "idx_properties_owner_user_id" ON "properties"("owner_user_id");

-- CreateIndex
CREATE INDEX "idx_properties_broker_user_id" ON "properties"("broker_user_id");

-- CreateIndex
CREATE INDEX "idx_properties_mode_type" ON "properties"("mode", "property_type");

-- CreateIndex
CREATE INDEX "idx_properties_city_price" ON "properties"("city", "price");

-- CreateIndex
CREATE INDEX "idx_listing_property_media_listing_id" ON "listing_property_media"("listing_id");

-- CreateIndex
CREATE INDEX "idx_listing_property_media_file_hash" ON "listing_property_media"("file_hash");

-- CreateIndex
CREATE INDEX "idx_seller_declarations_listing_id" ON "seller_declarations"("listing_id");

-- CreateIndex
CREATE INDEX "seller_declaration_drafts_listing_id_idx" ON "seller_declaration_drafts"("listing_id");

-- CreateIndex
CREATE INDEX "seller_declaration_drafts_seller_user_id_idx" ON "seller_declaration_drafts"("seller_user_id");

-- CreateIndex
CREATE INDEX "seller_declaration_drafts_admin_user_id_idx" ON "seller_declaration_drafts"("admin_user_id");

-- CreateIndex
CREATE INDEX "seller_declaration_drafts_status_idx" ON "seller_declaration_drafts"("status");

-- CreateIndex
CREATE INDEX "seller_declaration_ai_events_draft_id_idx" ON "seller_declaration_ai_events"("draft_id");

-- CreateIndex
CREATE INDEX "seller_declaration_ai_events_section_key_idx" ON "seller_declaration_ai_events"("section_key");

-- CreateIndex
CREATE INDEX "seller_declaration_ai_events_action_type_idx" ON "seller_declaration_ai_events"("action_type");

-- CreateIndex
CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");

-- CreateIndex
CREATE INDEX "document_versions_created_by_idx" ON "document_versions"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_id_version_number_key" ON "document_versions"("document_id", "version_number");

-- CreateIndex
CREATE INDEX "document_audit_logs_document_id_idx" ON "document_audit_logs"("document_id");

-- CreateIndex
CREATE INDEX "document_audit_logs_actor_user_id_idx" ON "document_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "document_audit_logs_action_type_idx" ON "document_audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "document_signatures_document_id_idx" ON "document_signatures"("document_id");

-- CreateIndex
CREATE INDEX "document_signatures_status_idx" ON "document_signatures"("status");

-- CreateIndex
CREATE INDEX "document_signatures_negotiation_version_id_idx" ON "document_signatures"("negotiation_version_id");

-- CreateIndex
CREATE INDEX "legal_graph_nodes_entity_type_entity_id_idx" ON "legal_graph_nodes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "legal_graph_nodes_node_type_idx" ON "legal_graph_nodes"("node_type");

-- CreateIndex
CREATE INDEX "legal_graph_edges_from_node_id_idx" ON "legal_graph_edges"("from_node_id");

-- CreateIndex
CREATE INDEX "legal_graph_edges_to_node_id_idx" ON "legal_graph_edges"("to_node_id");

-- CreateIndex
CREATE INDEX "legal_graph_edges_edge_type_idx" ON "legal_graph_edges"("edge_type");

-- CreateIndex
CREATE INDEX "legal_graph_issues_property_id_idx" ON "legal_graph_issues"("property_id");

-- CreateIndex
CREATE INDEX "legal_graph_issues_issue_type_idx" ON "legal_graph_issues"("issue_type");

-- CreateIndex
CREATE INDEX "legal_graph_issues_status_idx" ON "legal_graph_issues"("status");

-- CreateIndex
CREATE INDEX "legal_graph_issues_severity_idx" ON "legal_graph_issues"("severity");

-- CreateIndex
CREATE INDEX "knowledge_documents_type_idx" ON "knowledge_documents"("type");

-- CreateIndex
CREATE INDEX "knowledge_chunks_document_id_idx" ON "knowledge_chunks"("document_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_page_number_idx" ON "knowledge_chunks"("page_number");

-- CreateIndex
CREATE INDEX "knowledge_chunks_chunk_type_idx" ON "knowledge_chunks"("chunk_type");

-- CreateIndex
CREATE INDEX "knowledge_chunks_audience_idx" ON "knowledge_chunks"("audience");

-- CreateIndex
CREATE INDEX "knowledge_chunks_importance_idx" ON "knowledge_chunks"("importance");

-- CreateIndex
CREATE INDEX "auto_drafting_events_document_id_idx" ON "auto_drafting_events"("document_id");

-- CreateIndex
CREATE INDEX "auto_drafting_events_created_by_idx" ON "auto_drafting_events"("created_by");

-- CreateIndex
CREATE INDEX "auto_drafting_events_action_type_idx" ON "auto_drafting_events"("action_type");

-- CreateIndex
CREATE INDEX "autonomous_workflow_tasks_document_id_idx" ON "autonomous_workflow_tasks"("document_id");

-- CreateIndex
CREATE INDEX "autonomous_workflow_tasks_property_id_idx" ON "autonomous_workflow_tasks"("property_id");

-- CreateIndex
CREATE INDEX "autonomous_workflow_tasks_status_idx" ON "autonomous_workflow_tasks"("status");

-- CreateIndex
CREATE INDEX "autonomous_workflow_tasks_priority_idx" ON "autonomous_workflow_tasks"("priority");

-- CreateIndex
CREATE INDEX "autonomous_workflow_tasks_target_user_role_idx" ON "autonomous_workflow_tasks"("target_user_role");

-- CreateIndex
CREATE INDEX "autonomous_workflow_tasks_created_at_idx" ON "autonomous_workflow_tasks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "workflow_automation_events_entity_type_entity_id_idx" ON "workflow_automation_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_automation_events_trigger_type_idx" ON "workflow_automation_events"("trigger_type");

-- CreateIndex
CREATE INDEX "model_validation_runs_created_at_idx" ON "model_validation_runs"("created_at");

-- CreateIndex
CREATE INDEX "model_validation_runs_status_idx" ON "model_validation_runs"("status");

-- CreateIndex
CREATE INDEX "model_validation_runs_validation_run_kind_idx" ON "model_validation_runs"("validation_run_kind");

-- CreateIndex
CREATE INDEX "model_validation_runs_comparison_target_run_id_idx" ON "model_validation_runs"("comparison_target_run_id");

-- CreateIndex
CREATE INDEX "model_validation_runs_applied_tuning_profile_id_idx" ON "model_validation_runs"("applied_tuning_profile_id");

-- CreateIndex
CREATE INDEX "validation_run_comparisons_base_run_id_idx" ON "validation_run_comparisons"("base_run_id");

-- CreateIndex
CREATE INDEX "validation_run_comparisons_comparison_run_id_idx" ON "validation_run_comparisons"("comparison_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_validation_run_comparison_pair" ON "validation_run_comparisons"("base_run_id", "comparison_run_id");

-- CreateIndex
CREATE INDEX "calibration_batches_created_at_idx" ON "calibration_batches"("created_at");

-- CreateIndex
CREATE INDEX "calibration_batches_status_idx" ON "calibration_batches"("status");

-- CreateIndex
CREATE INDEX "calibration_batches_active_tuning_profile_id_idx" ON "calibration_batches"("active_tuning_profile_id");

-- CreateIndex
CREATE INDEX "calibration_batch_items_batch_id_idx" ON "calibration_batch_items"("batch_id");

-- CreateIndex
CREATE INDEX "calibration_batch_items_entity_type_entity_id_idx" ON "calibration_batch_items"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_calibration_batch_item_entity" ON "calibration_batch_items"("batch_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "calibration_drift_alerts_batch_id_idx" ON "calibration_drift_alerts"("batch_id");

-- CreateIndex
CREATE INDEX "calibration_drift_alerts_status_idx" ON "calibration_drift_alerts"("status");

-- CreateIndex
CREATE INDEX "calibration_drift_alerts_severity_idx" ON "calibration_drift_alerts"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "leads_marketplace_lead_id_key" ON "leads_marketplace"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_marketplace_stripe_session_id_key" ON "leads_marketplace"("stripe_session_id");

-- CreateIndex
CREATE INDEX "leads_marketplace_status_idx" ON "leads_marketplace"("status");

-- CreateIndex
CREATE INDEX "leads_marketplace_score_idx" ON "leads_marketplace"("score");

-- CreateIndex
CREATE INDEX "leads_marketplace_buyer_id_idx" ON "leads_marketplace"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_lecipm_subscriptions_user_id_key" ON "broker_lecipm_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_lecipm_subscriptions_stripe_subscription_id_key" ON "broker_lecipm_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "broker_lecipm_subscriptions_plan_slug_idx" ON "broker_lecipm_subscriptions"("plan_slug");

-- CreateIndex
CREATE INDEX "broker_lecipm_subscriptions_status_idx" ON "broker_lecipm_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "broker_leads_lead_id_key" ON "broker_leads"("lead_id");

-- CreateIndex
CREATE INDEX "broker_leads_broker_id_idx" ON "broker_leads"("broker_id");

-- CreateIndex
CREATE INDEX "broker_leads_broker_id_billing_status_idx" ON "broker_leads"("broker_id", "billing_status");

-- CreateIndex
CREATE INDEX "broker_leads_broker_invoice_id_idx" ON "broker_leads"("broker_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_invoices_stripe_session_id_key" ON "broker_invoices"("stripe_session_id");

-- CreateIndex
CREATE INDEX "broker_invoices_broker_id_idx" ON "broker_invoices"("broker_id");

-- CreateIndex
CREATE INDEX "broker_invoices_status_idx" ON "broker_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "broker_payments_stripe_payment_intent_id_key" ON "broker_payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "broker_payments_broker_id_idx" ON "broker_payments"("broker_id");

-- CreateIndex
CREATE INDEX "broker_payments_broker_invoice_id_idx" ON "broker_payments"("broker_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "public_share_links_token_key" ON "public_share_links"("token");

-- CreateIndex
CREATE INDEX "public_share_links_resource_type_resource_key_idx" ON "public_share_links"("resource_type", "resource_key");

-- CreateIndex
CREATE INDEX "share_click_events_share_link_id_idx" ON "share_click_events"("share_link_id");

-- CreateIndex
CREATE INDEX "share_click_events_created_at_idx" ON "share_click_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "seo_blog_posts_slug_key" ON "seo_blog_posts"("slug");

-- CreateIndex
CREATE INDEX "seo_blog_posts_published_at_idx" ON "seo_blog_posts"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_cities_slug_key" ON "lecipm_cities"("slug");

-- CreateIndex
CREATE INDEX "lecipm_cities_status_idx" ON "lecipm_cities"("status");

-- CreateIndex
CREATE INDEX "lecipm_cities_country_idx" ON "lecipm_cities"("country");

-- CreateIndex
CREATE INDEX "seo_page_contents_city_slug_idx" ON "seo_page_contents"("city_slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_seo_page_content_city_kind" ON "seo_page_contents"("city_slug", "page_kind");

-- CreateIndex
CREATE INDEX "model_validation_items_run_id_idx" ON "model_validation_items"("run_id");

-- CreateIndex
CREATE INDEX "model_validation_items_entity_type_entity_id_idx" ON "model_validation_items"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_model_validation_item_run_entity" ON "model_validation_items"("run_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "tuning_profiles_created_at_idx" ON "tuning_profiles"("created_at");

-- CreateIndex
CREATE INDEX "tuning_profiles_based_on_validation_run_id_idx" ON "tuning_profiles"("based_on_validation_run_id");

-- CreateIndex
CREATE INDEX "tuning_profiles_is_active_idx" ON "tuning_profiles"("is_active");

-- CreateIndex
CREATE INDEX "tuning_comparisons_validation_run_id_idx" ON "tuning_comparisons"("validation_run_id");

-- CreateIndex
CREATE INDEX "tuning_comparisons_tuning_profile_id_idx" ON "tuning_comparisons"("tuning_profile_id");

-- CreateIndex
CREATE INDEX "daily_deal_feed_snapshots_user_id_generated_for_date_idx" ON "daily_deal_feed_snapshots"("user_id", "generated_for_date");

-- CreateIndex
CREATE INDEX "daily_deal_feed_snapshots_workspace_id_generated_for_date_idx" ON "daily_deal_feed_snapshots"("workspace_id", "generated_for_date");

-- CreateIndex
CREATE INDEX "daily_deal_feed_items_snapshot_id_rank_position_idx" ON "daily_deal_feed_items"("snapshot_id", "rank_position");

-- CreateIndex
CREATE INDEX "daily_deal_feed_items_listing_id_idx" ON "daily_deal_feed_items"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_feed_preferences_user_id_key" ON "user_feed_preferences"("user_id");

-- CreateIndex
CREATE INDEX "feed_interactions_user_id_created_at_idx" ON "feed_interactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "feed_interactions_listing_id_created_at_idx" ON "feed_interactions"("listing_id", "created_at");

-- CreateIndex
CREATE INDEX "watchlists_user_id_idx" ON "watchlists"("user_id");

-- CreateIndex
CREATE INDEX "watchlist_items_listing_id_idx" ON "watchlist_items"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_watchlist_id_listing_id_key" ON "watchlist_items"("watchlist_id", "listing_id");

-- CreateIndex
CREATE INDEX "idx_watchlist_alerts_user_id" ON "watchlist_alerts"("user_id");

-- CreateIndex
CREATE INDEX "idx_watchlist_alerts_listing_id" ON "watchlist_alerts"("listing_id");

-- CreateIndex
CREATE INDEX "idx_watchlist_alerts_status" ON "watchlist_alerts"("status");

-- CreateIndex
CREATE INDEX "idx_watchlist_alerts_created_at_desc" ON "watchlist_alerts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_watchlist_alerts_alert_type" ON "watchlist_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "idx_watchlist_snapshots_user_listing" ON "watchlist_snapshots"("user_id", "listing_id");

-- CreateIndex
CREATE INDEX "idx_watchlist_snapshots_listing_id" ON "watchlist_snapshots"("listing_id");

-- CreateIndex
CREATE INDEX "idx_watchlist_snapshots_created_at_desc" ON "watchlist_snapshots"("created_at" DESC);

-- CreateIndex
CREATE INDEX "negotiation_chains_property_id_idx" ON "negotiation_chains"("property_id");

-- CreateIndex
CREATE INDEX "negotiation_chains_case_id_idx" ON "negotiation_chains"("case_id");

-- CreateIndex
CREATE INDEX "negotiation_chains_status_idx" ON "negotiation_chains"("status");

-- CreateIndex
CREATE INDEX "negotiation_versions_chain_id_idx" ON "negotiation_versions"("chain_id");

-- CreateIndex
CREATE INDEX "negotiation_versions_parent_version_id_idx" ON "negotiation_versions"("parent_version_id");

-- CreateIndex
CREATE INDEX "negotiation_versions_status_idx" ON "negotiation_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_negotiation_versions_chain_version" ON "negotiation_versions"("chain_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "negotiation_terms_version_id_key" ON "negotiation_terms"("version_id");

-- CreateIndex
CREATE INDEX "negotiation_clauses_version_id_idx" ON "negotiation_clauses"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ai_growth_plans_plan_date" ON "ai_growth_content_plans"("plan_date");

-- CreateIndex
CREATE INDEX "idx_ai_growth_items_plan_id" ON "ai_growth_content_items"("plan_id");

-- CreateIndex
CREATE INDEX "idx_ai_growth_items_status" ON "ai_growth_content_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ai_growth_perf_item_date" ON "ai_growth_performance_snapshots"("item_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_marketing_channels_status" ON "marketing_channels"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_marketing_channel_platform_ext" ON "marketing_channels"("platform", "external_account_id");

-- CreateIndex
CREATE INDEX "idx_growth_content_items_status" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "idx_growth_content_items_scheduled" ON "content_items"("scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "uq_growth_perf_item_date" ON "content_performance_metrics"("content_item_id", "metric_date");

-- CreateIndex
CREATE INDEX "idx_marketing_engine_content_type_status" ON "lecipm_marketing_engine_content"("type", "status");

-- CreateIndex
CREATE INDEX "idx_marketing_engine_content_platform" ON "lecipm_marketing_engine_content"("platform");

-- CreateIndex
CREATE INDEX "idx_marketing_engine_content_created" ON "lecipm_marketing_engine_content"("created_at");

-- CreateIndex
CREATE INDEX "idx_growth_funnel_event_name_time" ON "growth_funnel_events"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "idx_growth_funnel_user" ON "growth_funnel_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_conversion_plans_code_key" ON "lecipm_conversion_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_conversion_subscriptions_user_id_key" ON "lecipm_conversion_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_conversion_subscriptions_provider_subscription_id_key" ON "lecipm_conversion_subscriptions"("provider_subscription_id");

-- CreateIndex
CREATE INDEX "idx_lecipm_conv_sub_status" ON "lecipm_conversion_subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_lecipm_conv_usage_user" ON "lecipm_conversion_usage"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lecipm_conv_usage_user_period" ON "lecipm_conversion_usage"("user_id", "period_key");

-- CreateIndex
CREATE INDEX "idx_lecipm_conv_ent_plan" ON "lecipm_conversion_entitlements"("plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lecipm_conv_ent_plan_feature" ON "lecipm_conversion_entitlements"("plan_code", "feature_key");

-- CreateIndex
CREATE INDEX "bnhub_restricted_zones_is_active_idx" ON "bnhub_restricted_zones"("is_active");

-- CreateIndex
CREATE INDEX "bnhub_restricted_zones_postal_code_idx" ON "bnhub_restricted_zones"("postal_code");

-- CreateIndex
CREATE INDEX "bnhub_restricted_zones_region_code_idx" ON "bnhub_restricted_zones"("region_code");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_listing_safety_profiles_listing_id_key" ON "bnhub_listing_safety_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_safety_profiles_review_status_idx" ON "bnhub_listing_safety_profiles"("review_status");

-- CreateIndex
CREATE INDEX "bnhub_listing_safety_profiles_listing_id_idx" ON "bnhub_listing_safety_profiles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_safety_flags_listing_id_idx" ON "bnhub_safety_flags"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_safety_flags_status_idx" ON "bnhub_safety_flags"("status");

-- CreateIndex
CREATE INDEX "bnhub_safety_flags_severity_idx" ON "bnhub_safety_flags"("severity");

-- CreateIndex
CREATE INDEX "bnhub_safety_audit_logs_listing_id_idx" ON "bnhub_safety_audit_logs"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_safety_audit_logs_actor_user_id_idx" ON "bnhub_safety_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "bnhub_safety_audit_logs_created_at_idx" ON "bnhub_safety_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_guest_favorites_guest_user_id_idx" ON "bnhub_guest_favorites"("guest_user_id");

-- CreateIndex
CREATE INDEX "bnhub_guest_favorites_listing_id_idx" ON "bnhub_guest_favorites"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_guest_favorites_user_listing_key" ON "bnhub_guest_favorites"("guest_user_id", "listing_id");

-- CreateIndex
CREATE INDEX "bnhub_mobile_notification_queue_user_id_status_idx" ON "bnhub_mobile_notification_queue"("user_id", "status");

-- CreateIndex
CREATE INDEX "bnhub_mobile_notification_queue_scheduled_for_idx" ON "bnhub_mobile_notification_queue"("scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_review_moderation_review_id_key" ON "bnhub_review_moderation"("review_id");

-- CreateIndex
CREATE INDEX "bnhub_review_moderation_status_idx" ON "bnhub_review_moderation"("status");

-- CreateIndex
CREATE INDEX "bnhub_review_abuse_reports_review_id_idx" ON "bnhub_review_abuse_reports"("review_id");

-- CreateIndex
CREATE INDEX "bnhub_review_abuse_reports_reporter_user_id_idx" ON "bnhub_review_abuse_reports"("reporter_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_services_service_code_key" ON "bnhub_services"("service_code");

-- CreateIndex
CREATE INDEX "bnhub_services_category_idx" ON "bnhub_services"("category");

-- CreateIndex
CREATE INDEX "bnhub_services_is_active_idx" ON "bnhub_services"("is_active");

-- CreateIndex
CREATE INDEX "bnhub_listing_services_listing_id_idx" ON "bnhub_listing_services"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_services_service_id_idx" ON "bnhub_listing_services"("service_id");

-- CreateIndex
CREATE INDEX "bnhub_listing_services_host_user_id_idx" ON "bnhub_listing_services"("host_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_listing_services_listing_service_key" ON "bnhub_listing_services"("listing_id", "service_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_services_booking_id_idx" ON "bnhub_booking_services"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_services_listing_id_idx" ON "bnhub_booking_services"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_services_service_id_idx" ON "bnhub_booking_services"("service_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_services_guest_user_id_idx" ON "bnhub_booking_services"("guest_user_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_services_host_user_id_idx" ON "bnhub_booking_services"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_service_requests_booking_id_idx" ON "bnhub_service_requests"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_service_requests_listing_id_idx" ON "bnhub_service_requests"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_service_requests_guest_user_id_idx" ON "bnhub_service_requests"("guest_user_id");

-- CreateIndex
CREATE INDEX "bnhub_service_requests_host_user_id_idx" ON "bnhub_service_requests"("host_user_id");

-- CreateIndex
CREATE INDEX "bnhub_service_requests_status_idx" ON "bnhub_service_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_service_bundles_bundle_code_key" ON "bnhub_service_bundles"("bundle_code");

-- CreateIndex
CREATE INDEX "bnhub_service_bundles_bundle_code_idx" ON "bnhub_service_bundles"("bundle_code");

-- CreateIndex
CREATE INDEX "bnhub_service_bundles_is_active_idx" ON "bnhub_service_bundles"("is_active");

-- CreateIndex
CREATE INDEX "bnhub_service_bundles_target_segment_idx" ON "bnhub_service_bundles"("target_segment");

-- CreateIndex
CREATE INDEX "bnhub_bundle_items_bundle_id_idx" ON "bnhub_bundle_items"("bundle_id");

-- CreateIndex
CREATE INDEX "bnhub_bundle_items_service_id_idx" ON "bnhub_bundle_items"("service_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_bundles_booking_id_idx" ON "bnhub_booking_bundles"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_bundles_bundle_id_idx" ON "bnhub_booking_bundles"("bundle_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_bundles_guest_user_id_idx" ON "bnhub_booking_bundles"("guest_user_id");

-- CreateIndex
CREATE INDEX "bnhub_booking_bundles_listing_id_idx" ON "bnhub_booking_bundles"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_concierge_sessions_user_id_idx" ON "bnhub_concierge_sessions"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_concierge_sessions_booking_id_idx" ON "bnhub_concierge_sessions"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_concierge_sessions_listing_id_idx" ON "bnhub_concierge_sessions"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_concierge_sessions_session_status_idx" ON "bnhub_concierge_sessions"("session_status");

-- CreateIndex
CREATE INDEX "bnhub_concierge_messages_session_id_idx" ON "bnhub_concierge_messages"("session_id");

-- CreateIndex
CREATE INDEX "bnhub_concierge_messages_created_at_idx" ON "bnhub_concierge_messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_membership_plans_membership_code_key" ON "bnhub_membership_plans"("membership_code");

-- CreateIndex
CREATE INDEX "bnhub_membership_plans_membership_code_idx" ON "bnhub_membership_plans"("membership_code");

-- CreateIndex
CREATE INDEX "bnhub_membership_plans_is_active_idx" ON "bnhub_membership_plans"("is_active");

-- CreateIndex
CREATE INDEX "bnhub_user_memberships_user_id_idx" ON "bnhub_user_memberships"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_user_memberships_plan_id_idx" ON "bnhub_user_memberships"("plan_id");

-- CreateIndex
CREATE INDEX "bnhub_user_memberships_membership_status_idx" ON "bnhub_user_memberships"("membership_status");

-- CreateIndex
CREATE INDEX "bnhub_service_provider_profiles_provider_user_id_idx" ON "bnhub_service_provider_profiles"("provider_user_id");

-- CreateIndex
CREATE INDEX "bnhub_service_provider_profiles_provider_type_idx" ON "bnhub_service_provider_profiles"("provider_type");

-- CreateIndex
CREATE INDEX "bnhub_service_provider_profiles_verification_status_idx" ON "bnhub_service_provider_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "bnhub_service_safety_rules_scope_type_idx" ON "bnhub_service_safety_rules"("scope_type");

-- CreateIndex
CREATE INDEX "bnhub_service_safety_rules_scope_id_idx" ON "bnhub_service_safety_rules"("scope_id");

-- CreateIndex
CREATE INDEX "bnhub_service_safety_rules_service_code_idx" ON "bnhub_service_safety_rules"("service_code");

-- CreateIndex
CREATE INDEX "bnhub_service_safety_rules_is_enabled_idx" ON "bnhub_service_safety_rules"("is_enabled");

-- CreateIndex
CREATE INDEX "bnhub_service_audit_logs_entity_type_entity_id_idx" ON "bnhub_service_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "bnhub_service_audit_logs_actor_id_idx" ON "bnhub_service_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "bnhub_service_audit_logs_created_at_idx" ON "bnhub_service_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "bnhub_travel_products_product_type_idx" ON "bnhub_travel_products"("product_type");

-- CreateIndex
CREATE INDEX "bnhub_travel_products_status_idx" ON "bnhub_travel_products"("status");

-- CreateIndex
CREATE INDEX "bnhub_travel_products_provider_profile_id_idx" ON "bnhub_travel_products"("provider_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_service_discount_rules_rule_code_key" ON "bnhub_service_discount_rules"("rule_code");

-- CreateIndex
CREATE INDEX "bnhub_service_discount_rules_is_active_idx" ON "bnhub_service_discount_rules"("is_active");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lecipm_city_id_fkey" FOREIGN KEY ("lecipm_city_id") REFERENCES "lecipm_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecipm_ai_operator_settings" ADD CONSTRAINT "lecipm_ai_operator_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecipm_user_explainer_media" ADD CONSTRAINT "lecipm_user_explainer_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_workspaces" ADD CONSTRAINT "enterprise_workspaces_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_workspace_members" ADD CONSTRAINT "enterprise_workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_workspace_members" ADD CONSTRAINT "enterprise_workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_workspace_invites" ADD CONSTRAINT "enterprise_workspace_invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_workspace_invites" ADD CONSTRAINT "enterprise_workspace_invites_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_history" ADD CONSTRAINT "deal_history_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_history" ADD CONSTRAINT "deal_history_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_broker_reputation" ADD CONSTRAINT "workspace_broker_reputation_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_broker_reputation" ADD CONSTRAINT "workspace_broker_reputation_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_deal_shares" ADD CONSTRAINT "workspace_deal_shares_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_collaboration_messages" ADD CONSTRAINT "workspace_collaboration_messages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_collaboration_messages" ADD CONSTRAINT "workspace_collaboration_messages_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_collaboration_messages" ADD CONSTRAINT "workspace_collaboration_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_referrals" ADD CONSTRAINT "workspace_referrals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_referrals" ADD CONSTRAINT "workspace_referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_email_logs" ADD CONSTRAINT "growth_email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_license_policy" ADD CONSTRAINT "content_license_policy_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_license_acceptances" ADD CONSTRAINT "content_license_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_listings" ADD CONSTRAINT "rental_listings_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "rental_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "rental_leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immo_contact_logs" ADD CONSTRAINT "immo_contact_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immo_contact_logs" ADD CONSTRAINT "immo_contact_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immo_contact_logs" ADD CONSTRAINT "immo_contact_logs_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immo_contact_logs" ADD CONSTRAINT "immo_contact_logs_admin_noted_by_id_fkey" FOREIGN KEY ("admin_noted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_experts" ADD CONSTRAINT "mortgage_experts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_codes" ADD CONSTRAINT "two_factor_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_subscriptions" ADD CONSTRAINT "expert_subscriptions_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_billing" ADD CONSTRAINT "expert_billing_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_invoices" ADD CONSTRAINT "expert_invoices_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_payout_records" ADD CONSTRAINT "expert_payout_records_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_credits" ADD CONSTRAINT "expert_credits_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_expert_reviews" ADD CONSTRAINT "mortgage_expert_reviews_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_expert_reviews" ADD CONSTRAINT "mortgage_expert_reviews_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_brokers" ADD CONSTRAINT "mortgage_brokers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_requests" ADD CONSTRAINT "mortgage_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_requests" ADD CONSTRAINT "mortgage_requests_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_requests" ADD CONSTRAINT "mortgage_requests_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_lead_unlocks" ADD CONSTRAINT "mortgage_lead_unlocks_mortgage_request_id_fkey" FOREIGN KEY ("mortgage_request_id") REFERENCES "mortgage_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_lead_unlocks" ADD CONSTRAINT "mortgage_lead_unlocks_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_mortgage_request_id_fkey" FOREIGN KEY ("mortgage_request_id") REFERENCES "mortgage_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_lead_distribution_logs" ADD CONSTRAINT "mortgage_lead_distribution_logs_mortgage_request_id_fkey" FOREIGN KEY ("mortgage_request_id") REFERENCES "mortgage_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_lead_distribution_logs" ADD CONSTRAINT "mortgage_lead_distribution_logs_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_deals" ADD CONSTRAINT "mortgage_deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_deals" ADD CONSTRAINT "mortgage_deals_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_in_app_notifications" ADD CONSTRAINT "expert_in_app_notifications_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsbo_listings" ADD CONSTRAINT "fsbo_listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsbo_listings" ADD CONSTRAINT "fsbo_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_canonical_property_id_fkey" FOREIGN KEY ("canonical_property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_short_term_listing_id_fkey" FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_factors" ADD CONSTRAINT "deal_analysis_factors_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_scenarios" ADD CONSTRAINT "deal_analysis_scenarios_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_comparables" ADD CONSTRAINT "deal_analysis_comparables_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_offer_strategies" ADD CONSTRAINT "deal_offer_strategies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_offer_strategies" ADD CONSTRAINT "deal_offer_strategies_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_strategy_scenarios" ADD CONSTRAINT "offer_strategy_scenarios_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_strategy_scenarios" ADD CONSTRAINT "offer_strategy_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_affordability_analyses" ADD CONSTRAINT "deal_affordability_analyses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_watchlists" ADD CONSTRAINT "deal_watchlists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_watchlist_items" ADD CONSTRAINT "deal_watchlist_items_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_watchlist_items" ADD CONSTRAINT "deal_watchlist_items_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_portfolio_alerts" ADD CONSTRAINT "deal_portfolio_alerts_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_portfolio_alerts" ADD CONSTRAINT "deal_portfolio_alerts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_pricing_advice" ADD CONSTRAINT "seller_pricing_advice_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_refresh_jobs" ADD CONSTRAINT "deal_analysis_refresh_jobs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_refresh_jobs" ADD CONSTRAINT "deal_analysis_refresh_jobs_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_refresh_events" ADD CONSTRAINT "deal_analysis_refresh_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_analysis_refresh_events" ADD CONSTRAINT "deal_analysis_refresh_events_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_negotiation_playbooks" ADD CONSTRAINT "deal_negotiation_playbooks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_negotiation_playbooks" ADD CONSTRAINT "deal_negotiation_playbooks_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_negotiation_playbooks" ADD CONSTRAINT "deal_negotiation_playbooks_offer_strategy_id_fkey" FOREIGN KEY ("offer_strategy_id") REFERENCES "deal_offer_strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_repricing_reviews" ADD CONSTRAINT "seller_repricing_reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_repricing_triggers" ADD CONSTRAINT "seller_repricing_triggers_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_monitoring_snapshots" ADD CONSTRAINT "portfolio_monitoring_snapshots_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_monitoring_events" ADD CONSTRAINT "portfolio_monitoring_events_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_monitoring_events" ADD CONSTRAINT "portfolio_monitoring_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_content_fingerprints" ADD CONSTRAINT "media_content_fingerprints_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_ai_scores" ADD CONSTRAINT "listing_ai_scores_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsbo_listing_documents" ADD CONSTRAINT "fsbo_listing_documents_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_signals" ADD CONSTRAINT "verification_signals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_rule_results" ADD CONSTRAINT "verification_rule_results_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_profiles" ADD CONSTRAINT "trust_profiles_last_case_id_fkey" FOREIGN KEY ("last_case_id") REFERENCES "verification_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_actions" ADD CONSTRAINT "human_review_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_actions" ADD CONSTRAINT "human_review_actions_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_verification_jobs" ADD CONSTRAINT "media_verification_jobs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_extracted_document_records" ADD CONSTRAINT "trustgraph_extracted_document_records_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "trustgraph_extraction_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_extracted_document_fields" ADD CONSTRAINT "trustgraph_extracted_document_fields_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "trustgraph_extracted_document_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_extraction_review_actions" ADD CONSTRAINT "trustgraph_extraction_review_actions_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "trustgraph_extracted_document_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_graph_edges" ADD CONSTRAINT "fraud_graph_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "fraud_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_graph_edges" ADD CONSTRAINT "fraud_graph_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "fraud_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_geospatial_validations" ADD CONSTRAINT "trustgraph_geospatial_validations_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_compliance_workspace_members" ADD CONSTRAINT "trustgraph_compliance_workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_compliance_workspace_members" ADD CONSTRAINT "trustgraph_compliance_workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_compliance_workspace_entity_links" ADD CONSTRAINT "trustgraph_compliance_workspace_entity_links_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_workspace_case_assignments" ADD CONSTRAINT "trustgraph_workspace_case_assignments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_workspace_case_assignments" ADD CONSTRAINT "trustgraph_workspace_case_assignments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_document_approval_flows" ADD CONSTRAINT "trustgraph_document_approval_flows_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_document_approval_steps" ADD CONSTRAINT "trustgraph_document_approval_steps_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "trustgraph_document_approval_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_document_approval_actions" ADD CONSTRAINT "trustgraph_document_approval_actions_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "trustgraph_document_approval_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_document_approval_actions" ADD CONSTRAINT "trustgraph_document_approval_actions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "trustgraph_document_approval_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_sla_policies" ADD CONSTRAINT "trustgraph_sla_policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_case_sla_states" ADD CONSTRAINT "trustgraph_case_sla_states_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_case_sla_states" ADD CONSTRAINT "trustgraph_case_sla_states_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "trustgraph_sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_subscriptions" ADD CONSTRAINT "trustgraph_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_subscriptions" ADD CONSTRAINT "trustgraph_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "trustgraph_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_partner_api_keys" ADD CONSTRAINT "trustgraph_partner_api_keys_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trustgraph_recertification_events" ADD CONSTRAINT "trustgraph_recertification_events_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "trustgraph_recertification_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_verification_links" ADD CONSTRAINT "entity_verification_links_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsbo_listing_verifications" ADD CONSTRAINT "fsbo_listing_verifications_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsbo_leads" ADD CONSTRAINT "fsbo_leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsbo_leads" ADD CONSTRAINT "fsbo_leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_assigned_broker_id_fkey" FOREIGN KEY ("assigned_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_access" ADD CONSTRAINT "advisory_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_access" ADD CONSTRAINT "advisory_access_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_listing_views" ADD CONSTRAINT "buyer_listing_views_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_listing_views" ADD CONSTRAINT "buyer_listing_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_listing_views" ADD CONSTRAINT "buyer_listing_views_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_saved_listings" ADD CONSTRAINT "buyer_saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_saved_listings" ADD CONSTRAINT "buyer_saved_listings_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_hosts" ADD CONSTRAINT "bnhub_hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_promotion_orders" ADD CONSTRAINT "bnhub_promotion_orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bnhub_promotion_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_promotion_orders" ADD CONSTRAINT "bnhub_promotion_orders_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_promotion_orders" ADD CONSTRAINT "bnhub_promotion_orders_short_term_listing_id_fkey" FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sales_assist_entries" ADD CONSTRAINT "bnhub_sales_assist_entries_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sales_assist_entries" ADD CONSTRAINT "bnhub_sales_assist_entries_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sales_assist_entries" ADD CONSTRAINT "bnhub_sales_assist_entries_converted_booking_id_fkey" FOREIGN KEY ("converted_booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_automation_events" ADD CONSTRAINT "bnhub_automation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_agreements" ADD CONSTRAINT "bnhub_host_agreements_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "bnhub_hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_listings" ADD CONSTRAINT "bnhub_host_listings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "bnhub_hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_hub_rooms" ADD CONSTRAINT "hotel_hub_rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel_hub_hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_hub_bookings" ADD CONSTRAINT "hotel_hub_bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "hotel_hub_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_package_bookings" ADD CONSTRAINT "travel_package_bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listings" ADD CONSTRAINT "bnhub_listings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listings" ADD CONSTRAINT "bnhub_listings_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_property_classification" ADD CONSTRAINT "bnhub_property_classification_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_luxury_tiers" ADD CONSTRAINT "bnhub_luxury_tiers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_trust_profiles" ADD CONSTRAINT "bnhub_trust_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_trust_profiles" ADD CONSTRAINT "bnhub_trust_profiles_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_fraud_flags" ADD CONSTRAINT "bnhub_fraud_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_fraud_flags" ADD CONSTRAINT "bnhub_fraud_flags_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_identity_verifications" ADD CONSTRAINT "bnhub_identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_address_verifications" ADD CONSTRAINT "bnhub_address_verifications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_media_validations" ADD CONSTRAINT "bnhub_media_validations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_risk_profiles" ADD CONSTRAINT "bnhub_listing_risk_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_risk_profiles" ADD CONSTRAINT "bnhub_listing_risk_profiles_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_risk_flags" ADD CONSTRAINT "bnhub_risk_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_risk_flags" ADD CONSTRAINT "bnhub_risk_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_risk_flags" ADD CONSTRAINT "bnhub_risk_flags_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_location_policy_profiles" ADD CONSTRAINT "bnhub_location_policy_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_dynamic_pricing_profiles" ADD CONSTRAINT "bnhub_dynamic_pricing_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_pricing_history" ADD CONSTRAINT "bnhub_pricing_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_quality_profiles" ADD CONSTRAINT "bnhub_host_quality_profiles_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_disclosures" ADD CONSTRAINT "seller_disclosures_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_template_answers" ADD CONSTRAINT "listing_template_answers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_compliance_reviews" ADD CONSTRAINT "listing_compliance_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_compliance_reviews" ADD CONSTRAINT "listing_compliance_reviews_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_applications" ADD CONSTRAINT "broker_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_applications" ADD CONSTRAINT "host_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_applications" ADD CONSTRAINT "developer_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_disclosures" ADD CONSTRAINT "property_disclosures_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BnhubListingPhoto" ADD CONSTRAINT "BnhubListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVerificationLog" ADD CONSTRAINT "ListingVerificationLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_extractions" ADD CONSTRAINT "document_extractions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "property_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_matches" ADD CONSTRAINT "verification_matches_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_matches" ADD CONSTRAINT "verification_matches_document_extraction_id_fkey" FOREIGN KEY ("document_extraction_id") REFERENCES "document_extractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_fraud_alerts" ADD CONSTRAINT "verification_fraud_alerts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_fraud_scores" ADD CONSTRAINT "property_fraud_scores_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_fraud_alerts" ADD CONSTRAINT "property_fraud_alerts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_checks" ADD CONSTRAINT "fraud_checks_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_agreements" ADD CONSTRAINT "bnhub_booking_agreements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_profiles" ADD CONSTRAINT "bnhub_host_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_guest_profiles" ADD CONSTRAINT "bnhub_guest_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_activity_scores" ADD CONSTRAINT "broker_activity_scores_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_identities" ADD CONSTRAINT "property_identities_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_transactions" ADD CONSTRAINT "real_estate_transactions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_offers" ADD CONSTRAINT "property_offers_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_offers" ADD CONSTRAINT "property_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_counter_offers" ADD CONSTRAINT "property_counter_offers_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "property_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_counter_offers" ADD CONSTRAINT "property_counter_offers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_messages" ADD CONSTRAINT "transaction_messages_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_messages" ADD CONSTRAINT "transaction_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_deposits" ADD CONSTRAINT "transaction_deposits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_documents" ADD CONSTRAINT "transaction_documents_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_steps" ADD CONSTRAINT "transaction_steps_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_timelines" ADD CONSTRAINT "transaction_timelines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_timeline_steps" ADD CONSTRAINT "transaction_timeline_steps_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "transaction_timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_timeline_events" ADD CONSTRAINT "transaction_timeline_events_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "transaction_timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_identity_links" ADD CONSTRAINT "property_identity_links_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_identity_verifications" ADD CONSTRAINT "property_identity_verifications_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_identity_owners" ADD CONSTRAINT "property_identity_owners_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_identity_risk" ADD CONSTRAINT "property_identity_risk_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_identity_events" ADD CONSTRAINT "property_identity_events_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_authorities" ADD CONSTRAINT "listing_authorities_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_authorities" ADD CONSTRAINT "listing_authorities_owner_identity_id_fkey" FOREIGN KEY ("owner_identity_id") REFERENCES "owner_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_authorities" ADD CONSTRAINT "listing_authorities_broker_identity_id_fkey" FOREIGN KEY ("broker_identity_id") REFERENCES "broker_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_authorities" ADD CONSTRAINT "listing_authorities_organization_identity_id_fkey" FOREIGN KEY ("organization_identity_id") REFERENCES "organization_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_links" ADD CONSTRAINT "identity_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_history" ADD CONSTRAINT "ownership_history_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_history" ADD CONSTRAINT "ownership_history_owner_identity_id_fkey" FOREIGN KEY ("owner_identity_id") REFERENCES "owner_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_authorization_history" ADD CONSTRAINT "broker_authorization_history_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_authorization_history" ADD CONSTRAINT "broker_authorization_history_broker_identity_id_fkey" FOREIGN KEY ("broker_identity_id") REFERENCES "broker_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_authorization_history" ADD CONSTRAINT "broker_authorization_history_owner_identity_id_fkey" FOREIGN KEY ("owner_identity_id") REFERENCES "owner_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_valuations" ADD CONSTRAINT "property_valuations_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_regions" ADD CONSTRAINT "market_regions_parent_region_id_fkey" FOREIGN KEY ("parent_region_id") REFERENCES "market_regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_price_index" ADD CONSTRAINT "market_price_index_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_rent_index" ADD CONSTRAINT "market_rent_index_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_bnhub_index" ADD CONSTRAINT "market_bnhub_index_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_demand_metrics" ADD CONSTRAINT "market_demand_metrics_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_investment_scores" ADD CONSTRAINT "market_investment_scores_property_identity_id_fkey" FOREIGN KEY ("property_identity_id") REFERENCES "property_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_investment_scores" ADD CONSTRAINT "market_investment_scores_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_reports" ADD CONSTRAINT "market_reports_market_region_id_fkey" FOREIGN KEY ("market_region_id") REFERENCES "market_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_packages" ADD CONSTRAINT "closing_packages_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_packages" ADD CONSTRAINT "closing_packages_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_packages" ADD CONSTRAINT "closing_packages_notary_id_fkey" FOREIGN KEY ("notary_id") REFERENCES "notaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_package_documents" ADD CONSTRAINT "closing_package_documents_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "closing_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_package_documents" ADD CONSTRAINT "closing_package_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "generated_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_verifications" ADD CONSTRAINT "property_verifications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_verifications" ADD CONSTRAINT "broker_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_tax_registrations" ADD CONSTRAINT "broker_tax_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_tax_registrations" ADD CONSTRAINT "broker_tax_registrations_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_location_validation" ADD CONSTRAINT "property_location_validation_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_booked_by_booking_id_fkey" FOREIGN KEY ("booked_by_booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_mapping" ADD CONSTRAINT "external_mapping_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_channel_sync_logs" ADD CONSTRAINT "bnhub_channel_sync_logs_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "external_mapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_channel_connections" ADD CONSTRAINT "bnhub_channel_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_channel_mappings" ADD CONSTRAINT "bnhub_channel_mappings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_channel_mappings" ADD CONSTRAINT "bnhub_channel_mappings_channel_connection_id_fkey" FOREIGN KEY ("channel_connection_id") REFERENCES "bnhub_channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_channel_events" ADD CONSTRAINT "bnhub_channel_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_channel_events" ADD CONSTRAINT "bnhub_channel_events_channel_connection_id_fkey" FOREIGN KEY ("channel_connection_id") REFERENCES "bnhub_channel_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sync_logs" ADD CONSTRAINT "bnhub_sync_logs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "bnhub_channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sync_logs" ADD CONSTRAINT "bnhub_sync_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_accounts" ADD CONSTRAINT "bnhub_payment_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_payment_quote_id_fkey" FOREIGN KEY ("payment_quote_id") REFERENCES "bnhub_payment_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_legacy_payment_id_fkey" FOREIGN KEY ("legacy_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_holds" ADD CONSTRAINT "bnhub_payment_holds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_holds" ADD CONSTRAINT "bnhub_payment_holds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_disputes" ADD CONSTRAINT "bnhub_disputes_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_disputes" ADD CONSTRAINT "bnhub_disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "bnhub_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "bnhub_refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "bnhub_disputes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_financial_ledgers" ADD CONSTRAINT "bnhub_financial_ledgers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_financial_ledgers" ADD CONSTRAINT "bnhub_financial_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bn_guarantees" ADD CONSTRAINT "bn_guarantees_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_issues" ADD CONSTRAINT "bnhub_booking_issues_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BnhubBookingEvent" ADD CONSTRAINT "BnhubBookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BnhubCheckinDetails" ADD CONSTRAINT "BnhubCheckinDetails_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_invoices" ADD CONSTRAINT "bnhub_booking_invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_invoices" ADD CONSTRAINT "bnhub_booking_invoices_linked_contract_id_fkey" FOREIGN KEY ("linked_contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_resolutions" ADD CONSTRAINT "dispute_resolutions_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_account_warnings" ADD CONSTRAINT "host_account_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostQuality" ADD CONSTRAINT "HostQuality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ReferralProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ambassador" ADD CONSTRAINT "Ambassador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorPayout" ADD CONSTRAINT "AmbassadorPayout_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_investigations" ADD CONSTRAINT "listing_investigations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_enforcement_actions" ADD CONSTRAINT "listing_enforcement_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_holds" ADD CONSTRAINT "payout_holds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_risk_history" ADD CONSTRAINT "host_risk_history_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeMessage" ADD CONSTRAINT "DisputeMessage_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_linked_contract_id_fkey" FOREIGN KEY ("linked_contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_linked_contract_id_fkey" FOREIGN KEY ("linked_contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_commissions" ADD CONSTRAINT "broker_commissions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "platform_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_commissions" ADD CONSTRAINT "broker_commissions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payouts" ADD CONSTRAINT "broker_payouts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payouts" ADD CONSTRAINT "broker_payouts_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payouts" ADD CONSTRAINT "broker_payouts_recorded_paid_by_user_id_fkey" FOREIGN KEY ("recorded_paid_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payout_lines" ADD CONSTRAINT "broker_payout_lines_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "broker_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payout_lines" ADD CONSTRAINT "broker_payout_lines_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "broker_commissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_milestones" ADD CONSTRAINT "deal_milestones_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_documents" ADD CONSTRAINT "deal_documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "platform_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_revenue_ledger_entries" ADD CONSTRAINT "party_revenue_ledger_entries_platform_payment_id_fkey" FOREIGN KEY ("platform_payment_id") REFERENCES "platform_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_revenue_ledger_entries" ADD CONSTRAINT "party_revenue_ledger_entries_broker_commission_id_fkey" FOREIGN KEY ("broker_commission_id") REFERENCES "broker_commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_revenue_ledger_entries" ADD CONSTRAINT "party_revenue_ledger_entries_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_ledger_entries" ADD CONSTRAINT "stripe_ledger_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_ledger_entries" ADD CONSTRAINT "stripe_ledger_entries_platform_payment_id_fkey" FOREIGN KEY ("platform_payment_id") REFERENCES "platform_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_audit_logs" ADD CONSTRAINT "financial_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_rating_aggregates" ADD CONSTRAINT "property_rating_aggregates_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_performance" ADD CONSTRAINT "host_performance_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_badges" ADD CONSTRAINT "host_badges_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_conversations" ADD CONSTRAINT "copilot_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_messages" ADD CONSTRAINT "copilot_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "copilot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_runs" ADD CONSTRAINT "copilot_runs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "copilot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_runs" ADD CONSTRAINT "copilot_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_memory_items" ADD CONSTRAINT "copilot_memory_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_eval_items" ADD CONSTRAINT "ai_eval_items_eval_run_id_fkey" FOREIGN KEY ("eval_run_id") REFERENCES "ai_eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCampaign" ADD CONSTRAINT "PromotionCampaign_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MarketConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotedListing" ADD CONSTRAINT "PromotedListing_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_campaigns" ADD CONSTRAINT "bnhub_marketing_campaigns_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_campaigns" ADD CONSTRAINT "bnhub_marketing_campaigns_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_campaigns" ADD CONSTRAINT "bnhub_marketing_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_assets" ADD CONSTRAINT "bnhub_marketing_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_assets" ADD CONSTRAINT "bnhub_marketing_assets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_campaign_distributions" ADD CONSTRAINT "bnhub_campaign_distributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_campaign_distributions" ADD CONSTRAINT "bnhub_campaign_distributions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "bnhub_distribution_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_marketing_profiles" ADD CONSTRAINT "bnhub_listing_marketing_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_events" ADD CONSTRAINT "bnhub_marketing_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_events" ADD CONSTRAINT "bnhub_marketing_events_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "bnhub_campaign_distributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_recommendations" ADD CONSTRAINT "bnhub_marketing_recommendations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_marketing_recommendations" ADD CONSTRAINT "bnhub_marketing_recommendations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_email_campaign_queue" ADD CONSTRAINT "bnhub_email_campaign_queue_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_email_campaign_queue" ADD CONSTRAINT "bnhub_email_campaign_queue_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_growth_prefs" ADD CONSTRAINT "bnhub_host_growth_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_campaigns" ADD CONSTRAINT "bnhub_growth_campaigns_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_campaigns" ADD CONSTRAINT "bnhub_growth_campaigns_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_campaigns" ADD CONSTRAINT "bnhub_growth_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_assets" ADD CONSTRAINT "bnhub_growth_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_assets" ADD CONSTRAINT "bnhub_growth_assets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_distributions" ADD CONSTRAINT "bnhub_growth_distributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_distributions" ADD CONSTRAINT "bnhub_growth_distributions_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "bnhub_growth_connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "bnhub_growth_distributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_lead_events" ADD CONSTRAINT "bnhub_lead_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "bnhub_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_recommendations" ADD CONSTRAINT "bnhub_growth_recommendations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_growth_recommendations" ADD CONSTRAINT "bnhub_growth_recommendations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundraising_investor_interactions" ADD CONSTRAINT "fundraising_investor_interactions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "fundraising_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundraising_deals" ADD CONSTRAINT "fundraising_deals_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "fundraising_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_commitments" ADD CONSTRAINT "investor_commitments_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "fundraising_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_commitments" ADD CONSTRAINT "investor_commitments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "fundraising_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_execution_actions" ADD CONSTRAINT "revenue_execution_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pitch_deck_slides" ADD CONSTRAINT "pitch_deck_slides_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_agents" ADD CONSTRAINT "sales_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_assignments" ADD CONSTRAINT "sales_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "sales_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_assignments" ADD CONSTRAINT "sales_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_assignments" ADD CONSTRAINT "sales_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_performance" ADD CONSTRAINT "sales_performance_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "sales_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_candidate_interactions" ADD CONSTRAINT "hiring_candidate_interactions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "hiring_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_candidate_evaluations" ADD CONSTRAINT "hiring_candidate_evaluations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "hiring_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_candidate_trial_tasks" ADD CONSTRAINT "hiring_candidate_trial_tasks_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "hiring_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equity_grants" ADD CONSTRAINT "equity_grants_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "equity_holders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthCampaign" ADD CONSTRAINT "GrowthCampaign_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MarketConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcquisitionSource" ADD CONSTRAINT "AcquisitionSource_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GrowthCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketTaxRule" ADD CONSTRAINT "MarketTaxRule_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MarketConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPolicyBinding" ADD CONSTRAINT "MarketPolicyBinding_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MarketConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueLedgerEntry" ADD CONSTRAINT "RevenueLedgerEntry_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MarketConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelVersion" ADD CONSTRAINT "ModelVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDecisionLog" ADD CONSTRAINT "AiDecisionLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interaction_logs" ADD CONSTRAINT "ai_interaction_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_design_references" ADD CONSTRAINT "listing_design_references_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canva_invoices" ADD CONSTRAINT "canva_invoices_usage_id_fkey" FOREIGN KEY ("usage_id") REFERENCES "canva_design_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_agreements" ADD CONSTRAINT "user_agreements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_form_signatures" ADD CONSTRAINT "legal_form_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_contract_audit_logs" ADD CONSTRAINT "legal_contract_audit_logs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_contract_audit_logs" ADD CONSTRAINT "legal_contract_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_commission_records" ADD CONSTRAINT "platform_commission_records_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_commission_records" ADD CONSTRAINT "platform_commission_records_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_commission_records" ADD CONSTRAINT "platform_commission_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_commission_records" ADD CONSTRAINT "platform_commission_records_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_legal_disputes" ADD CONSTRAINT "platform_legal_disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_legal_disputes" ADD CONSTRAINT "platform_legal_disputes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_legal_disputes" ADD CONSTRAINT "platform_legal_disputes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_legal_disputes" ADD CONSTRAINT "platform_legal_disputes_opened_by_user_id_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_legal_disputes" ADD CONSTRAINT "platform_legal_disputes_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_offer_document_id_fkey" FOREIGN KEY ("offer_document_id") REFERENCES "offer_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_expenses" ADD CONSTRAINT "broker_expenses_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_expenses" ADD CONSTRAINT "broker_expenses_transaction_record_id_fkey" FOREIGN KEY ("transaction_record_id") REFERENCES "broker_transaction_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_accounting_entry_id_fkey" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_comparisons" ADD CONSTRAINT "property_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_scenarios" ADD CONSTRAINT "portfolio_scenarios_investor_profile_id_fkey" FOREIGN KEY ("investor_profile_id") REFERENCES "investor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_scenarios" ADD CONSTRAINT "portfolio_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_scenario_items" ADD CONSTRAINT "portfolio_scenario_items_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "portfolio_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_portfolio_alerts" ADD CONSTRAINT "investor_portfolio_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_agreements" ADD CONSTRAINT "legal_agreements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisActionLog" ADD CONSTRAINT "CrisisActionLog_crisisId_fkey" FOREIGN KEY ("crisisId") REFERENCES "CrisisEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_incidents" ADD CONSTRAINT "trust_safety_incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_incidents" ADD CONSTRAINT "trust_safety_incidents_accused_user_id_fkey" FOREIGN KEY ("accused_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_incidents" ADD CONSTRAINT "trust_safety_incidents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_incidents" ADD CONSTRAINT "trust_safety_incidents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_evidence" ADD CONSTRAINT "trust_safety_evidence_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "trust_safety_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_actions" ADD CONSTRAINT "trust_safety_actions_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "trust_safety_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_safety_profiles" ADD CONSTRAINT "user_safety_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_safety_profiles" ADD CONSTRAINT "listing_safety_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_appeals" ADD CONSTRAINT "trust_safety_appeals_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "trust_safety_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_appeals" ADD CONSTRAINT "trust_safety_appeals_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_safety_incident_responses" ADD CONSTRAINT "trust_safety_incident_responses_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "trust_safety_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_listing_access" ADD CONSTRAINT "broker_listing_access_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_listing_access" ADD CONSTRAINT "broker_listing_access_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_listing_access" ADD CONSTRAINT "broker_listing_access_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_short_term_listing_id_fkey" FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assigned_expert_id_fkey" FOREIGN KEY ("assigned_expert_id") REFERENCES "mortgage_experts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_introduced_by_broker_id_fkey" FOREIGN KEY ("introduced_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_last_follow_up_by_broker_id_fkey" FOREIGN KEY ("last_follow_up_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_platform_conversation_id_fkey" FOREIGN KEY ("platform_conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_crm_events" ADD CONSTRAINT "internal_crm_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_crm_events" ADD CONSTRAINT "internal_crm_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_crm_events" ADD CONSTRAINT "internal_crm_events_short_term_listing_id_fkey" FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_crm_events" ADD CONSTRAINT "internal_crm_events_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_crm_events" ADD CONSTRAINT "internal_crm_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_contact_audit_events" ADD CONSTRAINT "lead_contact_audit_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "crm_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_automation_tasks" ADD CONSTRAINT "lead_automation_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_contact_consents" ADD CONSTRAINT "lead_contact_consents_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_comm_messages" ADD CONSTRAINT "lead_comm_messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_timeline_events" ADD CONSTRAINT "lead_timeline_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_up_jobs" ADD CONSTRAINT "lead_follow_up_jobs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_playbook_steps" ADD CONSTRAINT "conversion_playbook_steps_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "conversion_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_playbook_executions" ADD CONSTRAINT "conversion_playbook_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_playbook_executions" ADD CONSTRAINT "conversion_playbook_executions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_playbook_executions" ADD CONSTRAINT "conversion_playbook_executions_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "conversion_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_retention_touchpoints" ADD CONSTRAINT "client_retention_touchpoints_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_retention_touchpoints" ADD CONSTRAINT "client_retention_touchpoints_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_user_activity_logs" ADD CONSTRAINT "ai_user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation_history" ADD CONSTRAINT "ai_recommendation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_marketing_content" ADD CONSTRAINT "ai_marketing_content_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viral_short_script_records" ADD CONSTRAINT "viral_short_script_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_profiles" ADD CONSTRAINT "user_ai_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_automation_events" ADD CONSTRAINT "ai_automation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_automation_events" ADD CONSTRAINT "ai_automation_events_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_conversations" ADD CONSTRAINT "broker_conversations_broker1_id_fkey" FOREIGN KEY ("broker1_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_conversations" ADD CONSTRAINT "broker_conversations_broker2_id_fkey" FOREIGN KEY ("broker2_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_conversation_messages" ADD CONSTRAINT "broker_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "broker_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_conversation_messages" ADD CONSTRAINT "broker_conversation_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubscription" ADD CONSTRAINT "ProjectSubscription_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLeadPayment" ADD CONSTRAINT "ProjectLeadPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUnit" ADD CONSTRAINT "ProjectUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteProject" ADD CONSTRAINT "FavoriteProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReservation" ADD CONSTRAINT "ProjectReservation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReservation" ADD CONSTRAINT "ProjectReservation_projectUnitId_fkey" FOREIGN KEY ("projectUnitId") REFERENCES "ProjectUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_deals" ADD CONSTRAINT "investment_deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_deals" ADD CONSTRAINT "investment_deals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_deal_visits" ADD CONSTRAINT "shared_deal_visits_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_deal_visits" ADD CONSTRAINT "shared_deal_visits_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_users_tracking" ADD CONSTRAINT "early_users_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_email_queue" ADD CONSTRAINT "growth_email_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_conversations" ADD CONSTRAINT "growth_ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_conversations" ADD CONSTRAINT "growth_ai_conversations_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_conversation_messages" ADD CONSTRAINT "growth_ai_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_assistant_insights" ADD CONSTRAINT "deal_assistant_insights_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_conversation_handoffs" ADD CONSTRAINT "growth_ai_conversation_handoffs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_conversation_decisions" ADD CONSTRAINT "growth_ai_conversation_decisions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_template_outcome_events" ADD CONSTRAINT "growth_ai_template_outcome_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_lead_orchestrations" ADD CONSTRAINT "growth_ai_lead_orchestrations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_ai_action_logs" ADD CONSTRAINT "growth_ai_action_logs_orchestration_id_fkey" FOREIGN KEY ("orchestration_id") REFERENCES "growth_ai_lead_orchestrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_action_runs" ADD CONSTRAINT "executive_action_runs_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "executive_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_events" ADD CONSTRAINT "demo_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormActivity" ADD CONSTRAINT "FormActivity_formSubmissionId_fkey" FOREIGN KEY ("formSubmissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_acquisition_leads" ADD CONSTRAINT "client_acquisition_leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_acquisition_daily_progress" ADD CONSTRAINT "client_acquisition_daily_progress_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_offers" ADD CONSTRAINT "listing_offers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_offers" ADD CONSTRAINT "listing_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_offers" ADD CONSTRAINT "listing_offers_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_offer_events" ADD CONSTRAINT "listing_offer_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_offer_events" ADD CONSTRAINT "listing_offer_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_offer_events" ADD CONSTRAINT "listing_offer_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_clients" ADD CONSTRAINT "broker_clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_clients" ADD CONSTRAINT "broker_clients_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_clients" ADD CONSTRAINT "broker_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_client_interactions" ADD CONSTRAINT "broker_client_interactions_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_client_interactions" ADD CONSTRAINT "broker_client_interactions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_client_listings" ADD CONSTRAINT "broker_client_listings_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_events" ADD CONSTRAINT "message_events_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_events" ADD CONSTRAINT "message_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_events" ADD CONSTRAINT "message_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "document_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "enterprise_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_grants" ADD CONSTRAINT "document_access_grants_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "document_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_grants" ADD CONSTRAINT "document_access_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "document_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "document_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_profiles" ADD CONSTRAINT "client_intake_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_profiles" ADD CONSTRAINT "client_intake_profiles_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_profiles" ADD CONSTRAINT "client_intake_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_intake_profile_id_fkey" FOREIGN KEY ("intake_profile_id") REFERENCES "client_intake_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_linked_document_file_id_fkey" FOREIGN KEY ("linked_document_file_id") REFERENCES "document_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_intake_profile_id_fkey" FOREIGN KEY ("intake_profile_id") REFERENCES "client_intake_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_required_document_item_id_fkey" FOREIGN KEY ("required_document_item_id") REFERENCES "required_document_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_queue_items" ADD CONSTRAINT "action_queue_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_queue_items" ADD CONSTRAINT "action_queue_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_action_queue_item_id_fkey" FOREIGN KEY ("action_queue_item_id") REFERENCES "action_queue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_financials" ADD CONSTRAINT "deal_financials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_financials" ADD CONSTRAINT "deal_financials_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_financials" ADD CONSTRAINT "deal_financials_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_financials" ADD CONSTRAINT "deal_financials_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_deal_financial_id_fkey" FOREIGN KEY ("deal_financial_id") REFERENCES "deal_financials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_tenant_invoice_id_fkey" FOREIGN KEY ("tenant_invoice_id") REFERENCES "tenant_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_deal_financial_id_fkey" FOREIGN KEY ("deal_financial_id") REFERENCES "deal_financials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_billing_profiles" ADD CONSTRAINT "tenant_billing_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_property_media" ADD CONSTRAINT "listing_property_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_declarations" ADD CONSTRAINT "seller_declarations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_declarations" ADD CONSTRAINT "seller_declarations_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_declaration_drafts" ADD CONSTRAINT "seller_declaration_drafts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_declaration_drafts" ADD CONSTRAINT "seller_declaration_drafts_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_declaration_drafts" ADD CONSTRAINT "seller_declaration_drafts_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_declaration_ai_events" ADD CONSTRAINT "seller_declaration_ai_events_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_negotiation_version_id_fkey" FOREIGN KEY ("negotiation_version_id") REFERENCES "negotiation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_graph_edges" ADD CONSTRAINT "legal_graph_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_graph_edges" ADD CONSTRAINT "legal_graph_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_graph_issues" ADD CONSTRAINT "legal_graph_issues_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_graph_issues" ADD CONSTRAINT "legal_graph_issues_related_node_id_fkey" FOREIGN KEY ("related_node_id") REFERENCES "legal_graph_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_drafting_events" ADD CONSTRAINT "auto_drafting_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_workflow_tasks" ADD CONSTRAINT "autonomous_workflow_tasks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_validation_runs" ADD CONSTRAINT "model_validation_runs_applied_tuning_profile_id_fkey" FOREIGN KEY ("applied_tuning_profile_id") REFERENCES "tuning_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_validation_runs" ADD CONSTRAINT "model_validation_runs_comparison_target_run_id_fkey" FOREIGN KEY ("comparison_target_run_id") REFERENCES "model_validation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_run_comparisons" ADD CONSTRAINT "validation_run_comparisons_base_run_id_fkey" FOREIGN KEY ("base_run_id") REFERENCES "model_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_run_comparisons" ADD CONSTRAINT "validation_run_comparisons_comparison_run_id_fkey" FOREIGN KEY ("comparison_run_id") REFERENCES "model_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_batches" ADD CONSTRAINT "calibration_batches_active_tuning_profile_id_fkey" FOREIGN KEY ("active_tuning_profile_id") REFERENCES "tuning_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_batch_items" ADD CONSTRAINT "calibration_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "calibration_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_drift_alerts" ADD CONSTRAINT "calibration_drift_alerts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "calibration_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_marketplace" ADD CONSTRAINT "leads_marketplace_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_marketplace" ADD CONSTRAINT "leads_marketplace_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_lecipm_subscriptions" ADD CONSTRAINT "broker_lecipm_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_monetization_profiles" ADD CONSTRAINT "broker_monetization_profiles_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_broker_invoice_id_fkey" FOREIGN KEY ("broker_invoice_id") REFERENCES "broker_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_invoices" ADD CONSTRAINT "broker_invoices_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payments" ADD CONSTRAINT "broker_payments_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payments" ADD CONSTRAINT "broker_payments_broker_lead_id_fkey" FOREIGN KEY ("broker_lead_id") REFERENCES "broker_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payments" ADD CONSTRAINT "broker_payments_broker_invoice_id_fkey" FOREIGN KEY ("broker_invoice_id") REFERENCES "broker_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_share_links" ADD CONSTRAINT "public_share_links_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_click_events" ADD CONSTRAINT "share_click_events_share_link_id_fkey" FOREIGN KEY ("share_link_id") REFERENCES "public_share_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_validation_items" ADD CONSTRAINT "model_validation_items_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "model_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuning_comparisons" ADD CONSTRAINT "tuning_comparisons_tuning_profile_id_fkey" FOREIGN KEY ("tuning_profile_id") REFERENCES "tuning_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deal_feed_snapshots" ADD CONSTRAINT "daily_deal_feed_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deal_feed_items" ADD CONSTRAINT "daily_deal_feed_items_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "daily_deal_feed_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deal_feed_items" ADD CONSTRAINT "daily_deal_feed_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feed_preferences" ADD CONSTRAINT "user_feed_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_interactions" ADD CONSTRAINT "feed_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_interactions" ADD CONSTRAINT "feed_interactions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_alerts" ADD CONSTRAINT "watchlist_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_alerts" ADD CONSTRAINT "watchlist_alerts_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "watchlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_alerts" ADD CONSTRAINT "watchlist_alerts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_snapshots" ADD CONSTRAINT "watchlist_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_snapshots" ADD CONSTRAINT "watchlist_snapshots_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_chains" ADD CONSTRAINT "negotiation_chains_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_chains" ADD CONSTRAINT "negotiation_chains_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_versions" ADD CONSTRAINT "negotiation_versions_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "negotiation_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_versions" ADD CONSTRAINT "negotiation_versions_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "negotiation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_versions" ADD CONSTRAINT "negotiation_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_terms" ADD CONSTRAINT "negotiation_terms_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "negotiation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_clauses" ADD CONSTRAINT "negotiation_clauses_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "negotiation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_growth_content_items" ADD CONSTRAINT "ai_growth_content_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "ai_growth_content_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_growth_performance_snapshots" ADD CONSTRAINT "ai_growth_performance_snapshots_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ai_growth_content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_marketing_channel_id_fkey" FOREIGN KEY ("marketing_channel_id") REFERENCES "marketing_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_performance_metrics" ADD CONSTRAINT "content_performance_metrics_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_funnel_events" ADD CONSTRAINT "growth_funnel_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_usage_counters" ADD CONSTRAINT "growth_usage_counters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecipm_conversion_subscriptions" ADD CONSTRAINT "lecipm_conversion_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecipm_conversion_subscriptions" ADD CONSTRAINT "lecipm_conversion_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "lecipm_conversion_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecipm_conversion_usage" ADD CONSTRAINT "lecipm_conversion_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_safety_profiles" ADD CONSTRAINT "bnhub_listing_safety_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_safety_profiles" ADD CONSTRAINT "bnhub_listing_safety_profiles_restricted_zone_id_fkey" FOREIGN KEY ("restricted_zone_id") REFERENCES "bnhub_restricted_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_safety_flags" ADD CONSTRAINT "bnhub_safety_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_guest_favorites" ADD CONSTRAINT "bnhub_guest_favorites_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_guest_favorites" ADD CONSTRAINT "bnhub_guest_favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_mobile_notification_queue" ADD CONSTRAINT "bnhub_mobile_notification_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_review_moderation" ADD CONSTRAINT "bnhub_review_moderation_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_review_abuse_reports" ADD CONSTRAINT "bnhub_review_abuse_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_services" ADD CONSTRAINT "bnhub_listing_services_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_services" ADD CONSTRAINT "bnhub_listing_services_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_listing_services" ADD CONSTRAINT "bnhub_listing_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_listing_service_id_fkey" FOREIGN KEY ("listing_service_id") REFERENCES "bnhub_listing_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_bundle_items" ADD CONSTRAINT "bnhub_bundle_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bnhub_service_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_bundle_items" ADD CONSTRAINT "bnhub_bundle_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bnhub_service_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_concierge_sessions" ADD CONSTRAINT "bnhub_concierge_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_concierge_sessions" ADD CONSTRAINT "bnhub_concierge_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_concierge_sessions" ADD CONSTRAINT "bnhub_concierge_sessions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_concierge_messages" ADD CONSTRAINT "bnhub_concierge_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "bnhub_concierge_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_user_memberships" ADD CONSTRAINT "bnhub_user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_user_memberships" ADD CONSTRAINT "bnhub_user_memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bnhub_membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_service_provider_profiles" ADD CONSTRAINT "bnhub_service_provider_profiles_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_travel_products" ADD CONSTRAINT "bnhub_travel_products_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "bnhub_service_provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
