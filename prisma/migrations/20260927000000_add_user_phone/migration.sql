-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "PhoneChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldPhone" TEXT,
    "newPhone" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneChange_userId_idx" ON "PhoneChange"("userId");

-- AddForeignKey
ALTER TABLE "PhoneChange" ADD CONSTRAINT "PhoneChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
