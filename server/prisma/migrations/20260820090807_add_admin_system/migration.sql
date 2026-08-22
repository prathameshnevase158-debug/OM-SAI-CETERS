-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "adminId" INTEGER;

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "whatsappKey" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "whatsappPhoneNumberId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_name_key" ON "Admin"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_whatsappKey_key" ON "Admin"("whatsappKey");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
