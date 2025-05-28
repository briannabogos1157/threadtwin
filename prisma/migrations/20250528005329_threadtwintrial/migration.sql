-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "fabric" TEXT[],
    "fit" TEXT[],
    "care" TEXT[],
    "construction" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMatch" (
    "id" TEXT NOT NULL,
    "originalProductId" TEXT NOT NULL,
    "dupeProductId" TEXT NOT NULL,
    "fabricScore" DOUBLE PRECISION NOT NULL,
    "fitScore" DOUBLE PRECISION NOT NULL,
    "careScore" DOUBLE PRECISION NOT NULL,
    "constructionScore" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_url_key" ON "Product"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMatch_originalProductId_dupeProductId_key" ON "ProductMatch"("originalProductId", "dupeProductId");

-- AddForeignKey
ALTER TABLE "ProductMatch" ADD CONSTRAINT "ProductMatch_originalProductId_fkey" FOREIGN KEY ("originalProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMatch" ADD CONSTRAINT "ProductMatch_dupeProductId_fkey" FOREIGN KEY ("dupeProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
