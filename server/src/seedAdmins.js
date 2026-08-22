import prisma from "./config/prisma.js";

const admins = [
  {
    id: 1,
    name: "DADA",
    whatsappKey: "ADMIN_1",
    whatsappNumber: null,
    whatsappPhoneNumberId: null,
    isActive: true,
  },
  {
    id: 2,
    name: "NAYANA",
    whatsappKey: "ADMIN_2",
    whatsappNumber: null,
    whatsappPhoneNumberId: null,
    isActive: true,
  },
  {
    id: 3,
    name: "OM",
    whatsappKey: "ADMIN_3",
    whatsappNumber: null,
    whatsappPhoneNumberId: null,
    isActive: true,
  },
  {
    id: 4,
    name: "SUNNY",
    whatsappKey: "ADMIN_4",
    whatsappNumber: null,
    whatsappPhoneNumberId: null,
    isActive: true,
  },
];

const seedAdmins = async () => {
  try {
    for (const admin of admins) {
      await prisma.admin.upsert({
        where: {
          whatsappKey: admin.whatsappKey,
        },

        update: {
          name: admin.name,
          isActive: true,
        },

        create: {
          id: admin.id,
          name: admin.name,
          whatsappKey: admin.whatsappKey,
          whatsappNumber:
            admin.whatsappNumber,
          whatsappPhoneNumberId:
            admin.whatsappPhoneNumberId,
          isActive: true,
        },
      });
    }

    console.log(
      "✅ DADA, NAYANA, OM, SUNNY created/updated successfully."
    );
  } catch (error) {
    console.error(
      "❌ Admin seed error:",
      error
    );
  } finally {
    await prisma.$disconnect();
  }
};

seedAdmins();