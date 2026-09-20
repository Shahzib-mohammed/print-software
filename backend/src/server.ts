// ===================================================================
// PrintQueue Backend Server
// Express API + Socket.IO Real-Time Dispatcher
// ===================================================================

import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import { Server as SocketIOServer } from "socket.io";

import { config } from "./config";
import { initPrinterSockets } from "./modules/printers/printers.socket";
import { startRetentionCleaner } from "./common/retentionCleaner";
import { prisma } from "./common/prisma";
import { sendSuccess, sendError } from "./common/response";

// Feature Routes
import authRoutes from "./modules/auth/auth.routes";
import shopsRoutes from "./modules/shops/shops.routes";
import pricingRoutes from "./modules/pricing/pricing.routes";
import productsRoutes from "./modules/products/products.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import paymentsRoutes from "./modules/payments/payments.routes";

const app = express();
const server = http.createServer(app);

// 1. CORS Configuration
app.use(
  cors({
    origin: "*", // For development simplicity; lock down to specific domains in production
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve static uploads (for local preview)
app.use("/uploads", express.static(config.uploadDir));

// 3. Secure File Download for Local Printer Agent
app.get("/api/orders/download/:fileId", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const fileRecord = await prisma.orderFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord || !fs.existsSync(fileRecord.storageKey)) {
      return sendError(res, "File not found or expired/purged", 404);
    }

    res.download(fileRecord.storageKey, fileRecord.originalFilename);
  } catch (err: any) {
    return sendError(res, "Download error", 500, err.message);
  }
});

// 4. Mount Feature Routes
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopsRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);

// 5. Health Check Endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  return sendSuccess(res, "PrintQueue API & Socket server is healthy", {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// 6. Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Server Error:", err);
  return sendError(res, err.message || "Internal server error", 500);
});

// 7. Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initPrinterSockets(io);

// 8. Start File Retention Auto-Purge Worker
startRetentionCleaner(15);

// 9. Start HTTP Server
server.listen(config.port, () => {
  console.log(`
  🚀 =======================================================
  PrintQueue Backend Running!
  API URL:       http://localhost:${config.port}
  Health Check:  http://localhost:${config.port}/api/health
  Storage Mode:  ${config.storageDriver} (${config.uploadDir})
  Cashfree Mode: ${config.cashfree.env}
  =======================================================
  `);
});
