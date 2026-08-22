import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const materials = [
  { name: "टेबल", stock: 20, rate: 40 },
  { name: "खुर्ची", stock: 100, rate: 10 },
  { name: "डबल शेगडी", stock: 2, rate: 200 },
  { name: "सिंगल शेगडी", stock: 1, rate: 200 },
  { name: "घमेली", stock: 10, rate: 10 },
  { name: "भातवाडी", stock: 10, rate: 5 },
  { name: "बादली", stock: 10, rate: 10 },
  { name: "वरंगाळी", stock: 10, rate: 5 },
  { name: "पळी", stock: 5, rate: 5 },
  { name: "दांडा पातेले", stock: 3, rate: 10 },
  { name: "पंचपाळे", stock: 2, rate: 20 },
  { name: "मग", stock: 5, rate: 10 },
  { name: "कडई", stock: 1, rate: 50 },
  { name: "परात", stock: 2, rate: 30 },
];

async function main() {
  for (const material of materials) {
    await prisma.material.upsert({
      where: {
        name: material.name,
      },
      update: {
        stock: material.stock,
        rate: material.rate,
      },
      create: material,
    });
  }

  console.log("सर्व साहित्य database मध्ये save झाले.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });