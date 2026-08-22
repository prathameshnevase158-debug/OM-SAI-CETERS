-- CreateEnum
CREATE TYPE "OrderProgress" AS ENUM ('BOOKED', 'PICKED_UP', 'PARTIAL_RETURN', 'RETURNED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "orderProgress" "OrderProgress" NOT NULL DEFAULT 'BOOKED',
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpByAdminId" INTEGER,
ADD COLUMN     "returnByAdminId" INTEGER,
ADD COLUMN     "returnedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pickedUpByAdminId_fkey" FOREIGN KEY ("pickedUpByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_returnByAdminId_fkey" FOREIGN KEY ("returnByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
