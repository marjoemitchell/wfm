-- CreateTable
CREATE TABLE "BallotMeasure" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "BallotMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BallotMeasure_slug_key" ON "BallotMeasure"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BallotMeasure_code_key" ON "BallotMeasure"("code");

-- CreateTable
CREATE TABLE "BallotMeasureExpenditure" (
    "id" TEXT NOT NULL,
    "ballotMeasureId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "support" BOOLEAN,
    "description" TEXT,
    "payee" TEXT,

    CONSTRAINT "BallotMeasureExpenditure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BallotMeasureExpenditure_ballotMeasureId_idx" ON "BallotMeasureExpenditure"("ballotMeasureId");

-- CreateIndex
CREATE INDEX "BallotMeasureExpenditure_donorId_idx" ON "BallotMeasureExpenditure"("donorId");

-- AddForeignKey
ALTER TABLE "BallotMeasureExpenditure" ADD CONSTRAINT "BallotMeasureExpenditure_ballotMeasureId_fkey" FOREIGN KEY ("ballotMeasureId") REFERENCES "BallotMeasure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotMeasureExpenditure" ADD CONSTRAINT "BallotMeasureExpenditure_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
