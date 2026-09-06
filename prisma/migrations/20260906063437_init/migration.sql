-- CreateEnum
CREATE TYPE "Level" AS ENUM ('FEDERAL', 'STATEWIDE', 'LEGISLATURE', 'JUDICIAL');

-- CreateEnum
CREATE TYPE "Party" AS ENUM ('R', 'D', 'N');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('FEC', 'PLACEHOLDER');

-- CreateTable
CREATE TABLE "Politician" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "office" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "party" "Party" NOT NULL,
    "cycle" INTEGER NOT NULL,
    "source" "Source" NOT NULL,
    "fecCandidateId" TEXT,
    "totalRaised" DECIMAL(14,2) NOT NULL,
    "cashOnHand" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employer" TEXT,
    "occupation" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "sector" TEXT NOT NULL,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "isPac" BOOLEAN NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Politician_slug_key" ON "Politician"("slug");

-- CreateIndex
CREATE INDEX "Politician_level_idx" ON "Politician"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Donor_slug_key" ON "Donor"("slug");

-- CreateIndex
CREATE INDEX "Donor_sector_idx" ON "Donor"("sector");

-- CreateIndex
CREATE INDEX "Donor_state_idx" ON "Donor"("state");

-- CreateIndex
CREATE INDEX "Contribution_politicianId_idx" ON "Contribution"("politicianId");

-- CreateIndex
CREATE INDEX "Contribution_donorId_idx" ON "Contribution"("donorId");

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
