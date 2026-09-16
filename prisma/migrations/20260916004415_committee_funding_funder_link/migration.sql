-- AlterTable
ALTER TABLE "CommitteeFunding" ADD COLUMN "funderDonorId" TEXT;

-- CreateIndex
CREATE INDEX "CommitteeFunding_funderDonorId_idx" ON "CommitteeFunding"("funderDonorId");

-- AddForeignKey
ALTER TABLE "CommitteeFunding" ADD CONSTRAINT "CommitteeFunding_funderDonorId_fkey" FOREIGN KEY ("funderDonorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
