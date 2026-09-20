// ===================================================================
// PrintQueue Database Seeder
// Seeds a ready-to-test shop, price rules, products, and admin account
// ===================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PrintQueue database...");

  // 1. Create or update sample shop
  const shop = await prisma.shop.upsert({
    where: { slug: "fastprint" },
    update: {},
    create: {
      name: "FastPrint Express",
      slug: "fastprint",
      logoUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&h=120&fit=crop",
      retentionHours: 25,
      gatewaySubmerchantId: "CF_SUB_TEST_101",
      status: "active",
    },
  });

  console.log(`✅ Shop created: ${shop.name} (/shop/${shop.slug})`);

  // 2. Create sample shop owner
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await prisma.shopAdmin.upsert({
    where: { email: "owner@fastprint.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Ramesh Sharma",
      email: "owner@fastprint.com",
      phone: "+91 98765 43210",
      passwordHash,
      role: "owner",
    },
  });

  console.log(`✅ Shop Admin created: ${admin.email} (password: password123)`);

  // 3. Clear existing price rules and add standard shop pricing
  await prisma.priceRule.deleteMany({ where: { shopId: shop.id } });

  const priceRules = [
    // Black & White
    { shopId: shop.id, printMode: "bw", sided: "single", paperType: "A4 70gsm", pricePerPage: 2.0 },
    { shopId: shop.id, printMode: "bw", sided: "double", paperType: "A4 70gsm", pricePerPage: 1.5 },
    // Color
    { shopId: shop.id, printMode: "color", sided: "single", paperType: "A4 70gsm", pricePerPage: 10.0 },
    { shopId: shop.id, printMode: "color", sided: "double", paperType: "A4 70gsm", pricePerPage: 8.0 },
    // Glossy Photo Paper
    { shopId: shop.id, printMode: "color", sided: "single", paperType: "A4 Glossy", pricePerPage: 25.0 },
  ];

  for (const rule of priceRules) {
    await prisma.priceRule.create({ data: rule });
  }

  console.log(`✅ ${priceRules.length} Price Rules seeded`);

  // 4. Clear existing products and add sample stationery & binding items
  await prisma.product.deleteMany({ where: { shopId: shop.id } });

  const products = [
    {
      shopId: shop.id,
      name: "Spiral Binding (up to 100 pages)",
      price: 35.0,
      variant: "Plastic Ring + Front Cover",
      stockQty: 250,
      isActive: true,
    },
    {
      shopId: shop.id,
      name: "Clear Document Folder / L-Folder",
      price: 15.0,
      variant: "A4 Transparent",
      stockQty: 500,
      isActive: true,
    },
    {
      shopId: shop.id,
      name: "Blue Ballpoint Pen",
      price: 10.0,
      variant: "0.7mm Tip",
      stockQty: 100,
      isActive: true,
    },
    {
      shopId: shop.id,
      name: "Stapling / Corner Clip",
      price: 2.0,
      variant: "Heavy duty staple",
      stockQty: 1000,
      isActive: true,
    },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }

  console.log(`✅ ${products.length} Products seeded`);

  // 5. Create default shop printer
  await prisma.printer.deleteMany({ where: { shopId: shop.id } });

  const printer = await prisma.printer.create({
    data: {
      shopId: shop.id,
      name: "HP LaserJet Pro MFP M428fdw (Counter 1)",
      connectionType: "wireless",
      isDefault: true,
      printerType: "all",
      status: "online",
      lastSeenAt: new Date(),
    },
  });

  console.log(`✅ Default Printer registered: ${printer.name}`);
  console.log("\n🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
