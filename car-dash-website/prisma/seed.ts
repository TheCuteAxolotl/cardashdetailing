import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const OWNER_EMAIL = "danielvo2142@gmail.com";
  const OWNER_PASSWORD = "1Babyturtles";
  const SALT_ROUNDS = 10;

  try {
    // Check if owner already exists
    const existingOwner = await prisma.user.findUnique({
      where: { email: OWNER_EMAIL },
    });

    if (existingOwner) {
      console.log(`✓ Owner account already exists: ${OWNER_EMAIL}`);
      
      // Ensure the existing account has the correct role
      if (existingOwner.role !== "owner") {
        await prisma.user.update({
          where: { email: OWNER_EMAIL },
          data: { role: "owner" },
        });
        console.log(`✓ Updated role to 'owner' for ${OWNER_EMAIL}`);
      }
      return;
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(OWNER_PASSWORD, SALT_ROUNDS);

    // Create the owner account
    const owner = await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        password: hashedPassword,
        name: "Daniel Vo",
        role: "owner",
      },
    });

    console.log(`✓ Owner account created successfully!`);
    console.log(`  Email: ${owner.email}`);
    console.log(`  Name: ${owner.name}`);
    console.log(`  Role: ${owner.role}`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
