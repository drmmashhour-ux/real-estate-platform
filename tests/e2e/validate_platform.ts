/**
 * LECIPM Platform Validation Script
 * This script performs basic health checks and connectivity tests 
 * across the independent applications.
 */

const APPS = {
  web: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001',
  bnhub: process.env.NEXT_PUBLIC_BNHUB_URL || 'http://localhost:3003',
  broker: process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:3004',
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002',
};

async function checkAppReady(name: string, url: string) {
  try {
    const response = await fetch(`${url}/api/ready`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ready') {
      console.log(`✅ [${name}] is ONLINE and READY`);
      return true;
    } else {
      console.error(`❌ [${name}] is OFFLINE or UNHEALTHY:`, data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error(`❌ [${name}] connection FAILED:`, (error as Error).message);
    return false;
  }
}

async function runValidation() {
  console.log('🚀 Starting LECIPM Platform Validation...\n');
  
  let allOk = true;
  for (const [name, url] of Object.entries(APPS)) {
    const ok = await checkAppReady(name, url);
    if (!ok) allOk = false;
  }

  console.log('\n--- Validation Result ---');
  if (allOk) {
    console.log('🎉 PLATFORM IS STABLE AND READY FOR LAUNCH!');
  } else {
    console.error('⚠️ PLATFORM HAS ISSUES. DO NOT LAUNCH.');
    process.exit(1);
  }
}

runValidation();
