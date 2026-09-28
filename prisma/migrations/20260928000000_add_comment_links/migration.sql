-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN "fbCommentLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
