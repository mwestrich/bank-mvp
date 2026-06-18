const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Always use the direct POSTGRES_URL for running heavy DDL or seed scripts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Connecting to the database...');
  const sqlPath = path.join(__dirname, 'db', 'seed_real.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing seed_real.sql... (This might take a few seconds)');
  
  // Split the file by DO $$ blocks to execute them one by one
  // Prisma executeRawUnsafe sometimes struggles with huge multi-statement files
  // But we will try executing the entire block first
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error executing seed script:');
    console.error(error.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
