-- CreateTable
CREATE TABLE "CommitteeFunding" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "funderName" TEXT NOT NULL,
    "funderCity" TEXT NOT NULL,
    "funderState" TEXT NOT NULL,
    "funderType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeFunding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommitteeFunding_committeeId_idx" ON "CommitteeFunding"("committeeId");

-- AddForeignKey
ALTER TABLE "CommitteeFunding" ADD CONSTRAINT "CommitteeFunding_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
