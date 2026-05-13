import admin from "firebase-admin";
import logger from "../utils/logger.js";
import { ApiError } from "./errorHandler.js";

let firebaseAdminAppInitialized = false;

function initFirebaseAdminIfNeeded() {
  if (firebaseAdminAppInitialized) return;

  // Prefer GOOGLE_APPLICATION_CREDENTIALS (JSON file path) if set.
  // Alternatively allow FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string).
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  try {
    if (svcJson && svcJson.trim()) {
      const parsed = JSON.parse(svcJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      firebaseAdminAppInitialized = true;
      logger.info("✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON");
      return;
    }

    // Falls back to Application Default Credentials (works on GCP / Cloud Run)
    admin.initializeApp();
    firebaseAdminAppInitialized = true;
    logger.info("✅ Firebase Admin initialized (application default credentials)");
  } catch (err) {
    logger.error("❌ Failed to initialize Firebase Admin:", {
      message: err?.message,
      stack: err?.stack,
    });
    throw err;
  }
}

function extractBearerToken(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization;
  if (!raw || typeof raw !== "string") return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function requireFirebaseAuth(req, res, next) {
  try {
    initFirebaseAdminIfNeeded();

    const token = extractBearerToken(req);
    if (!token) {
      throw new ApiError(401, "Missing Authorization bearer token");
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token, true);
    } catch (verifyErr) {
      const msg = verifyErr?.message || "Invalid auth token";
      // Map common Firebase auth failures to clear messages
      if (msg.toLowerCase().includes("expired")) {
        throw new ApiError(401, "Token expired");
      }
      throw new ApiError(401, msg);
    }

    req.user = {
      uid: decoded.uid,
      token: decoded,
    };
    next();
  } catch (err) {
    next(err);
  }
}

