-- AlterTable
ALTER TABLE "Donor" ADD COLUMN "fecCommitteeId" TEXT,
ADD COLUMN "committeeDesignation" TEXT,
ADD COLUMN "committeeOrgType" TEXT,
ADD COLUMN "registeredSince" TIMESTAMP(3);
