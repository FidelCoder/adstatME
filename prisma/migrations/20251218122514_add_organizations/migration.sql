-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CampaignCategory" AS ENUM ('FASHION', 'TECH', 'FOOD', 'TRAVEL', 'SPORTS', 'MUSIC', 'GAMING', 'FITNESS', 'BEAUTY', 'EDUCATION', 'BUSINESS', 'ENTERTAINMENT', 'HEALTH', 'AUTOMOTIVE', 'REAL_ESTATE', 'FINANCE', 'OTHER');

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_brand_id_fkey";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "category" "CampaignCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "organization_id" TEXT,
ALTER COLUMN "brand_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_campaigns" INTEGER NOT NULL DEFAULT 0,
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "can_create_campaigns" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_members" BOOLEAN NOT NULL DEFAULT false,
    "can_view_analytics" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_is_public_is_active_idx" ON "organizations"("is_public", "is_active");

-- CreateIndex
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "organization_members_role_idx" ON "organization_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns"("organization_id");

-- CreateIndex
CREATE INDEX "campaigns_category_idx" ON "campaigns"("category");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
