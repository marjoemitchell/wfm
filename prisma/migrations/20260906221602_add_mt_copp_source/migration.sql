-- AlterEnum
ALTER TYPE "Source" ADD VALUE 'MT_COPP';

-- AlterTable
ALTER TABLE "Politician" ADD COLUMN     "coppCandidateId" TEXT;
