// ===================================================================
// PrintQueue Configuration Loader
// Reads environment variables and provides sensible fallbacks
// ===================================================================

import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  // Server settings
  port: parseInt(process.env.PORT || "5000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // JWT Secret for shop admin sessions
  jwtSecret: process.env.JWT_SECRET || "printqueue_dev_secret_key",

  // Storage settings
  storageDriver: process.env.STORAGE_DRIVER || "local",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads"),

  // Payment gateway settings (Cashfree)
  cashfree: {
    env: process.env.CASHFREE_ENV || "MOCK", // "MOCK" or "TEST"
    appId: process.env.CASHFREE_APP_ID || "TEST_CASHFREE_APP_ID",
    secretKey: process.env.CASHFREE_SECRET_KEY || "TEST_CASHFREE_SECRET_KEY",
  },
};
