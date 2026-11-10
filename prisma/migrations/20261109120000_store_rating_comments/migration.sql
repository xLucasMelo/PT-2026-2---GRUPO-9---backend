ALTER TABLE "rating_comments" ALTER COLUMN "store_rating_id" DROP NOT NULL;

ALTER TABLE "rating_comments" ALTER COLUMN "product_rating_id" DROP NOT NULL;

CREATE UNIQUE INDEX "store_ratings_user_id_store_id_key" ON "store_ratings"("user_id", "store_id");
