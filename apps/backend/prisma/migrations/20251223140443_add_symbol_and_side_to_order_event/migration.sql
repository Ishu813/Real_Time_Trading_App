/*
  Warnings:

  - Added the required column `side` to the `OrderEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol` to the `OrderEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderEvent" ADD COLUMN     "side" TEXT NOT NULL,
ADD COLUMN     "symbol" TEXT NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL;
