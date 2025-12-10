-- AlterTable
ALTER TABLE "EmailRequest" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "lastEmailAttemptAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);
