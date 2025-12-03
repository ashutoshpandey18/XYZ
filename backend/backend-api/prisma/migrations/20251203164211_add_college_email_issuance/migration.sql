/*
  Warnings:

  - A unique constraint covering the columns `[collegeEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collegeEmail" TEXT,
ADD COLUMN     "emailIssued" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailIssuedAt" TIMESTAMP(3),
ADD COLUMN     "emailPassword" TEXT;

-- CreateTable
CREATE TABLE "IssuedEmailHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "issuedEmail" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuedEmailHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_collegeEmail_key" ON "User"("collegeEmail");

-- AddForeignKey
ALTER TABLE "IssuedEmailHistory" ADD CONSTRAINT "IssuedEmailHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
