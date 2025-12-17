-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('NEXUSPAY', 'MPESA', 'PAYSTACK', 'BANK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "whatsapp_verified" BOOLEAN NOT NULL DEFAULT false,
    "wallet_address" TEXT,
    "name" TEXT,
    "age_range" TEXT,
    "location_city" TEXT,
    "location_country" TEXT,
    "interests" TEXT[],
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "campaigns_completed" INTEGER NOT NULL DEFAULT 0,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_reshares" INTEGER NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "tier" "UserTier" NOT NULL DEFAULT 'BRONZE',
    "reputation_score" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "avg_view_rate" DECIMAL(3,2),
    "fraud_flags" INTEGER NOT NULL DEFAULT 0,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "device_fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "referrer_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "api_key" TEXT,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_campaigns" INTEGER NOT NULL DEFAULT 0,
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creative_url" TEXT NOT NULL,
    "watermark_id" TEXT NOT NULL,
    "call_to_action" TEXT,
    "target_locations" TEXT[],
    "target_age_ranges" TEXT[],
    "target_interests" TEXT[],
    "min_contacts" INTEGER,
    "min_view_rate" DECIMAL(3,2),
    "total_budget" DECIMAL(10,2) NOT NULL,
    "spent_budget" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(10,2) NOT NULL,
    "user_cpm" DECIMAL(10,2) NOT NULL,
    "flat_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reshare_bonus" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_posters" INTEGER NOT NULL,
    "target_impressions" INTEGER NOT NULL,
    "current_impressions" INTEGER NOT NULL DEFAULT 0,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "screenshot_url" TEXT,
    "views_count" INTEGER,
    "reshares_count" INTEGER,
    "posted_at" TIMESTAMP(3),
    "screenshot_uploaded_at" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verification_notes" TEXT,
    "base_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonus_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_reshare" BOOLEAN NOT NULL DEFAULT false,
    "original_post_id" TEXT,
    "device_fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reshares" (
    "id" TEXT NOT NULL,
    "original_post_id" TEXT NOT NULL,
    "reshared_by_user_id" TEXT NOT NULL,
    "reshare_post_id" TEXT NOT NULL,
    "views_count" INTEGER NOT NULL,
    "original_poster_bonus" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reshares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "method" "PayoutMethod" NOT NULL,
    "wallet_address" TEXT,
    "transaction_hash" TEXT,
    "network" TEXT,
    "phone_number" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "post_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_location_country_location_city_idx" ON "users"("location_country", "location_city");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "brands_email_key" ON "brands"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_api_key_key" ON "brands"("api_key");

-- CreateIndex
CREATE INDEX "brands_email_idx" ON "brands"("email");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_watermark_id_key" ON "campaigns"("watermark_id");

-- CreateIndex
CREATE INDEX "campaigns_brand_id_idx" ON "campaigns"("brand_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_start_date_end_date_idx" ON "campaigns"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "posts_user_id_campaign_id_idx" ON "posts"("user_id", "campaign_id");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "reshares_original_post_id_idx" ON "reshares"("original_post_id");

-- CreateIndex
CREATE INDEX "reshares_reshared_by_user_id_idx" ON "reshares"("reshared_by_user_id");

-- CreateIndex
CREATE INDEX "payouts_user_id_idx" ON "payouts"("user_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_created_at_idx" ON "payouts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reshares" ADD CONSTRAINT "reshares_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reshares" ADD CONSTRAINT "reshares_reshared_by_user_id_fkey" FOREIGN KEY ("reshared_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
