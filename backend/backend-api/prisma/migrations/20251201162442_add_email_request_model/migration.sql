-- CreateEnum
CREATE TYPE "EmailRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EmailRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "documentURL" TEXT NOT NULL,
    "status" "EmailRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailRequest" ADD CONSTRAINT "EmailRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
