/**
 * debug-checkout.mjs
 * Usage:
 *   node debug-checkout.mjs
 *
 * Optional env vars:
 *   API_BASE=http://localhost:8080
 *   TOKEN=... (if your backend requires auth)
 */

const API_BASE = process.env.API_BASE || "http://localhost:8080";
const TOKEN = process.env.TOKEN || "";

async function postJson(path, body) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text(); // IMPORTANT: read full body even if not JSON
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {}

  return {
    url,
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    raw: text,
    json,
  };
}

function printResult(label, r) {
  console.log(`\n=== ${label} ===`);
  console.log(`URL: ${r.url}`);
  console.log(`Status: ${r.status} ${r.statusText}`);
  console.log(`Server: ${r.headers.server || "(none)"}`);
  console.log(`Content-Type: ${r.headers["content-type"] || "(none)"}`);
  console.log(`Body (raw):\n${r.raw || "(empty)"}`);
  if (r.json) {
    console.log("\nBody (parsed JSON):");
    console.dir(r.json, { depth: 10 });
  }
}

async function main() {
  console.log("API_BASE =", API_BASE);
  console.log("TOKEN set =", Boolean(TOKEN));

  // Try payloads based on the actual backend schema
  const payloads = [
    {
      name: "Empty (to see validation behavior)",
      body: {},
    },
    {
      name: "Minimal required fields",
      body: {
        firstName: "Test",
        lastName: "User",
        phone: "03123456",
        address: "123 Test St",
        city: "Beirut",
        caza: "Beirut",
        country: "Lebanon",
        items: [{
          name: "Test Product",
          price: 50.00,
          quantity: 1,
          size: "100ml"
        }],
        shippingCost: 3.00,
        totalPrice: 53.00,
        paymentMethod: "Cash on Delivery",
        shippingMethod: "Express Delivery (2-3 Working Days)"
      },
    },
    {
      name: "Full payload (with email)",
      body: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "03123456",
        address: "123 Test St",
        city: "Beirut",
        caza: "Beirut",
        country: "Lebanon",
        items: [{
          id: "product-1",
          name: "Test Product",
          price: 50.00,
          quantity: 1,
          size: "100ml",
          image: "test.jpg"
        }],
        shippingCost: 3.00,
        totalPrice: 53.00,
        paymentMethod: "Cash on Delivery",
        shippingMethod: "Express Delivery (2-3 Working Days)",
        notes: ""
      },
    },
    {
      name: "Multiple items",
      body: {
        firstName: "Test",
        lastName: "User",
        phone: "03123456",
        address: "123 Test St",
        city: "Beirut",
        caza: "Beirut",
        country: "Lebanon",
        items: [
          {
            name: "Product 1",
            price: 30.00,
            quantity: 2,
            size: "50ml"
          },
          {
            name: "Product 2",
            price: 25.00,
            quantity: 1,
            size: "100ml"
          }
        ],
        shippingCost: 3.00,
        totalPrice: 88.00, // (30*2 + 25) + 3
        paymentMethod: "Cash on Delivery",
        shippingMethod: "Express Delivery (2-3 Working Days)"
      },
    },
  ];

  for (const p of payloads) {
    try {
      console.log(`\n📤 Sending payload: ${p.name}`);
      const r = await postJson("/api/orders/checkout", p.body);
      printResult(p.name, r);
      if (r.status >= 200 && r.status < 300) {
        console.log("\n✅ Success with payload:", p.name);
        process.exit(0);
      }
    } catch (e) {
      console.log(`\n=== ${p.name} FAILED TO CALL ===`);
      console.error(e);
    }
  }

  console.log("\n❌ None succeeded. Next step:");
  console.log("- If response body is empty: check backend logs for the exception stack trace.");
  console.log("- If response body mentions missing fields: adjust Checkout.tsx payload to match backend schema.");
  console.log("- If response says unauthorized: set TOKEN env var and re-run.");
  console.log("\n💡 Check your backend server logs for detailed error messages!");
}

main();
