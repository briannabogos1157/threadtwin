-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "brand" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "fabric" VARCHAR(255),
    "price" DECIMAL(10,2) NOT NULL,
    "retail_price" DECIMAL(10,2),
    "url" VARCHAR(1024) NOT NULL,
    "image" VARCHAR(1024),
    "category" VARCHAR(255),
    "source" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "affiliate_link" TEXT NOT NULL,
    "Color" UUID,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_url_key" ON "products"("url");

-- CreateIndex
CREATE INDEX "idx_products_affiliate_link" ON "products"("affiliate_link");

-- CreateIndex
CREATE INDEX "idx_products_brand_category" ON "products"("brand", "category");

-- CreateIndex
CREATE INDEX "idx_products_url" ON "products"("url");
