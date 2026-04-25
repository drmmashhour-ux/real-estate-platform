import { prisma } from "../lib/db";
import { logInfo, logError } from "../lib/server/logger";

async function runCheck() {
  console.log("🚀 Starting Production Readiness Check...");

  try {
    // 1. DB Check
    console.log("📡 Testing Database Connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database Connected.");

    // 2. Logging Test
    console.log("📝 Testing Logging System...");
    logInfo("system", "Test log from system-check");
    console.log("✅ Logging Initialized.");

    // 3. Schema Check (Audit Trail)
    console.log("🕵️ Testing Audit Trail Table...");
    await prisma.$queryRaw`SELECT count(*) FROM system_audit_logs`;
    console.log("✅ Audit Trail table accessible.");

    // 4. Schema Check (Document Hash)
    console.log("🔐 Testing Document Hash Table...");
    await prisma.$queryRaw`SELECT count(*) FROM document_hashes`;
    console.log("✅ Document Hash table accessible.");

    console.log("\n✨ System Check Complete: READY FOR PRODUCTION ✨");
    process.exit(0);
  } catch (error) {
    logError("system", "Production readiness check failed", error);
    console.error("\x1b[31m❌ System Check Failed. Check logs above.\x1b[0m");
    process.exit(1);
  }
}

runCheck();
