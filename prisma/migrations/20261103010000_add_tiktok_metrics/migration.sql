-- TikTok metrics for Team 2. Additive only: existing rows get 0 / empty.
ALTER TABLE "ActivityLog" ADD COLUMN "tiktokCommentsMade" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ActivityLog" ADD COLUMN "tiktokCommentLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ActivityLog" ADD COLUMN "tiktokAccountsCommented" INTEGER NOT NULL DEFAULT 0;
