#!/usr/bin/env node
/**
 * Mandatory test flow: register → login → APIs (needs Postgres + JWT_SECRET + dev server).
 * Usage: BASE_URL=http://localhost:3001 node scripts/run-demo-flow.mjs
 */

const BASE = process.env.BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

async function j(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(
      `${options?.method ?? "GET"} ${url} → ${res.status}${text ? `: ${text}` : ""}`
    );
  }
  return data;
}

async function main() {
  const run = Date.now();
  const pwd = "FlowTestPassword123!";
  const sellerEmail = `seller-${run}@demo.local`;
  const buyerEmail = `buyer-${run}@demo.local`;

  console.log(`BASE_URL=${BASE}\n`);

  const regSeller = await j(`${BASE}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      email: sellerEmail,
      password: pwd,
      role: "SELLER",
    }),
  });
  console.log("✓ Register seller →", regSeller.id);

  const regBuyer = await j(`${BASE}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      email: buyerEmail,
      password: pwd,
      role: "BUYER",
    }),
  });
  console.log("✓ Register buyer →", regBuyer.id);

  const login = await j(`${BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email: sellerEmail, password: pwd }),
  });
  console.log("✓ Login → token:", login.token?.slice(0, 24) + "…");

  const property = await j(`${BASE}/api/property`, {
    method: "POST",
    body: JSON.stringify({
      title: "Demo condo",
      price: 450000,
      city: "Montreal",
      description: "Flow demo",
      ownerId: regSeller.id,
    }),
  });
  console.log("✓ POST /api/property →", property.id);

  const properties = await j(`${BASE}/api/property`);
  console.log("✓ GET /api/property →", Array.isArray(properties) ? `${properties.length} row(s)` : properties);

  const message = await j(`${BASE}/api/message`, {
    method: "POST",
    body: JSON.stringify({
      content: "Interested in viewing this week.",
      senderId: regBuyer.id,
      receiverId: regSeller.id,
    }),
  });
  console.log("✓ POST /api/message →", message.id);

  const offer = await j(`${BASE}/api/offer`, {
    method: "POST",
    body: JSON.stringify({
      amount: 440000,
      buyerId: regBuyer.id,
      propertyId: property.id,
    }),
  });
  console.log("✓ POST /api/offer →", offer.id, "status:", offer.status);

  try {
    const chat = await j(`${BASE}/api/chat`, {
      method: "POST",
      body: JSON.stringify({ message: "Say hello in one sentence." }),
    });
    console.log("✓ POST /api/chat →", chat.reply?.slice?.(0, 80) ?? chat);
  } catch (e) {
    console.warn("⚠ POST /api/chat:", e.message);
  }

  const contract = await j(`${BASE}/api/contract`, {
    method: "POST",
    body: JSON.stringify({
      type: "BUY",
      fileUrl: `https://example.com/contracts/demo-${run}.pdf`,
      userId: regBuyer.id,
    }),
  });
  console.log("✓ POST /api/contract →", contract.id);

  const signature = await j(`${BASE}/api/sign`, {
    method: "POST",
    body: JSON.stringify({
      contractId: contract.id,
      userId: regBuyer.id,
    }),
  });
  console.log("✓ POST /api/sign →", signature.id);

  const closed = await j(`${BASE}/api/deal/close`, {
    method: "POST",
    body: JSON.stringify({ offerId: offer.id }),
  });
  console.log("✓ closeDeal (API) → offer status:", closed.status);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
