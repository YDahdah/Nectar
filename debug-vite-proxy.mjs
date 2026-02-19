/**
 * debug-vite-proxy.mjs
 *
 * Finds what port your backend is actually reachable on,
 * and prints the exact Vite proxy config to use.
 *
 * Usage:
 *   node debug-vite-proxy.mjs
 *
 * Optional env vars:
 *   HOST=localhost
 *   PORTS=3000,8081,8082,8085,9000,9090,3001,5000,7000
 */

const HOST = process.env.HOST || "localhost";
const PORTS = (process.env.PORTS || "3000,8081,8082,8085,9000,9090,3001,5000,7000")
  .split(",")
  .map((x) => parseInt(x.trim(), 10))
  .filter(Boolean);

const PATHS = [
  "/health",                // common Node.js health check
  "/api/health",            // common API health check
  "/api",                   // sometimes exists
  "/actuator/health",       // Spring Boot
];

async function tryGet(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const text = await res.text();
    return {
      ok: true,
      status: res.status,
      ct: res.headers.get("content-type") || "",
      server: res.headers.get("server") || "",
      sample: text.slice(0, 200),
    };
  } catch (e) {
    return { ok: false, err: e?.name || String(e) };
  } finally {
    clearTimeout(t);
  }
}

(async function main() {
  console.log("=== Vite Proxy Debug ===");
  console.log("HOST:", HOST);
  console.log("Ports to check:", PORTS.join(", "));
  console.log("Paths to try:", PATHS.join(", "));
  console.log("\nScanning for backend server...\n");

  let found = null;

  for (const port of PORTS) {
    for (const p of PATHS) {
      const url = `http://${HOST}:${port}${p}`;
      const r = await tryGet(url);

      if (r.ok) {
        console.log(`✅ Reachable: ${url}`);
        console.log(`   Status: ${r.status}`);
        console.log(`   Server: ${r.server || "(none)"}`);
        console.log(`   Content-Type: ${r.ct || "(none)"}`);
        console.log(`   Body sample: ${JSON.stringify(r.sample)}`);
        console.log("");

        // Spring actuator best signal:
        if (p === "/actuator/health" && r.ct.includes("application/json") && r.status === 200) {
          found = { host: HOST, port };
          break;
        }

        // If any endpoint returns 200, still consider it:
        if (r.status === 200 && !found) found = { host: HOST, port };
      } else {
        // only print hard failures for first path to reduce noise
        if (p === PATHS[0]) {
          // Don't print every failure to reduce noise
        }
      }
    }
    if (found) break;
  }

  if (!found) {
    console.log("\n❌ No backend found on these ports.");
    console.log("\nPossible fixes:");
    console.log("1) Start your backend server:");
    console.log("   cd server && npm start");
    console.log("\n2) If backend is in Docker/WSL, try:");
    console.log("   set HOST=host.docker.internal");
    console.log("   node debug-vite-proxy.mjs");
    console.log("\n3) If backend is another container, use container name:");
    console.log("   set HOST=<container_name>");
    console.log("   node debug-vite-proxy.mjs");
    console.log("\n4) Check if backend is running on a different port:");
    console.log("   netstat -ano | findstr LISTENING");
    console.log("   (Windows) or");
    console.log("   lsof -i -P -n | grep LISTEN");
    console.log("   (Mac/Linux)");
    process.exit(1);
  }

  console.log("\n=== ✅ Backend Found ===");
  console.log(`Target: http://${found.host}:${found.port}`);
  console.log("\n=== Suggested Vite Config ===");
  console.log("\nPaste this into vite.config.ts:\n");
  console.log(`export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://${found.host}:${found.port}",
        changeOrigin: true,
        secure: false,
      }
    }
  }
});`);

  console.log("\n=== Update .env file ===");
  console.log(`VITE_PROXY_TARGET=http://${found.host}:${found.port}`);
  
  console.log("\n=== Frontend Usage ===");
  console.log('Use relative paths in your frontend:');
  console.log(`fetch("/api/orders/checkout", ...)`);
  console.log("\n✅ This will proxy to: http://" + found.host + ":" + found.port + "/api/orders/checkout");
})();
