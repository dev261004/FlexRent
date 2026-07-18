import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  "Electronics",
  "Furniture",
  "Cameras",
  "Audio Equipment",
  "Sports Equipment",
  "Construction Tools",
  "Medical Equipment",
  "Event Equipment",
  "Home Appliances",
  "Office Equipment",
];

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const main = async (): Promise<void> => {
  await prisma.productCategory.createMany({
    data: categories.map((name) => ({
      name,
      slug: slugify(name),
      isActive: true,
    })),
    skipDuplicates: true,
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
