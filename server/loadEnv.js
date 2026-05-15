// Bulletproof dotenv loader.
//
// MUST be the first import in server.js. In ES modules, all import statements
// are hoisted and evaluated in depth-first order, BEFORE any module-level
// statements in the importer run. By isolating dotenv.config() in this
// module and importing it first, we guarantee env vars are available to
// every subsequently-imported module's top-level code (config.js,
// emailService.js, etc.). Putting `dotenv.config()` as a bare statement in
// server.js does NOT work because it runs AFTER all child imports are
// evaluated.
//
// On Render / Cloud Run / Vercel: env vars come from the platform and are
// already in process.env at process start, so dotenv.config() is a no-op
// (it just doesn't find a .env file). The startup logs below still fire
// and are the source of truth for whether the platform injected the
// expected vars.

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicit path so the loader works no matter what cwd the process was
// started from (Render, pm2, Docker, `node ./server/server.js`, etc.).
const envPath = join(__dirname, ".env");
const result = dotenv.config({ path: envPath });

if (result.error && result.error.code !== "ENOENT") {
  // eslint-disable-next-line no-console
  console.warn("[loadEnv] dotenv.config() error:", result.error.message);
}

// Startup diagnostic logs. These run BEFORE any other module's top-level
// code, so they are always the first email-related lines in the Render log
// for a given boot. Use raw console.log so they appear even if Winston is
// misconfigured.
// eslint-disable-next-line no-console
console.log("[loadEnv] dotenv source:", envPath, result.error ? "(no .env file — using platform env)" : "(loaded)");
// eslint-disable-next-line no-console
console.log("[loadEnv] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
// eslint-disable-next-line no-console
console.log("[loadEnv] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || "(unset → using onboarding@resend.dev)");
// eslint-disable-next-line no-console
console.log("[loadEnv] OWNER_EMAIL:", process.env.OWNER_EMAIL || "(unset)");
// eslint-disable-next-line no-console
console.log("[loadEnv] ORDER_EMAIL:", process.env.ORDER_EMAIL || "(unset)");
// eslint-disable-next-line no-console
console.log("[loadEnv] EMAIL_USER:", process.env.EMAIL_USER ? `(set: ${process.env.EMAIL_USER})` : "(unset)");
// eslint-disable-next-line no-console
console.log("[loadEnv] EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD);
// eslint-disable-next-line no-console
console.log("[loadEnv] NODE_ENV:", process.env.NODE_ENV || "(unset)");
