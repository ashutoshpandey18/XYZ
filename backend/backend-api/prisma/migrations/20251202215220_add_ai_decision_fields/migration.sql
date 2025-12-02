-- AlterTable
ALTER TABLE "EmailRequest" ADD COLUMN     "aiDecision" TEXT,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION;
