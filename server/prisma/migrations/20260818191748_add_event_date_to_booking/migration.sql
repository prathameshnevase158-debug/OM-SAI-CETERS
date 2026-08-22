-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "eventDate" TIMESTAMP(3),
ALTER COLUMN "totalQuantity" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "remainingAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Material" ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "rate" SET DEFAULT 0;
