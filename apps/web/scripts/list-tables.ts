import { prisma } from "../lib/db";

async function listTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[];
    console.log(tables.map(t => t.table_name).sort().join(', '));
  } catch (e) {
    console.error(e);
  }
}

listTables();
