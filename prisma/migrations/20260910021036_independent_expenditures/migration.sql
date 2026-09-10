-- CreateTable
CREATE TABLE "IndependentExpenditure" (
    "id" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "support" BOOLEAN NOT NULL,
    "description" TEXT,
    "payee" TEXT,

    CONSTRAINT "IndependentExpenditure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndependentExpenditure_politicianId_idx" ON "IndependentExpenditure"("politicianId");

-- CreateIndex
CREATE INDEX "IndependentExpenditure_donorId_idx" ON "IndependentExpenditure"("donorId");

-- AddForeignKey
ALTER TABLE "IndependentExpenditure" ADD CONSTRAINT "IndependentExpenditure_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndependentExpenditure" ADD CONSTRAINT "IndependentExpenditure_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
