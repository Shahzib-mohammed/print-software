// ===================================================================
// PrintQueue Windows Local Printer Agent Entry Point
// Connects to Cloud via WebSocket, downloads paid jobs, and spools them
// ===================================================================

import { io, Socket } from "socket.io-client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { discoverWindowsPrinters } from "./printerDiscovery";
import { submitPrintJob } from "./printSpooler";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const SHOP_SLUG = process.env.SHOP_SLUG || "fastprint";
const DOWNLOAD_DIR = path.resolve(process.cwd(), process.env.DOWNLOAD_DIR || "./temp_print_jobs");

// Ensure temp print directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

let socket: Socket;

async function startAgent() {
  console.log(`
  =======================================================
  🖨️  PrintQueue Local Printer Agent Starting...
  Shop Slug:    ${SHOP_SLUG}
  Backend URL:  ${BACKEND_URL}
  Download Dir: ${DOWNLOAD_DIR}
  =======================================================
  `);

  // 1. Detect printers on this Windows PC
  console.log("🔍 Detecting local printers...");
  const printers = await discoverWindowsPrinters();
  console.log(`Found ${printers.length} printer(s):`);
  printers.forEach((p) => console.log(`  - [${p.printerType.toUpperCase()}] ${p.name} (${p.connectionType}${p.isDefault ? ", DEFAULT" : ""})`));

  // 2. Fetch Shop ID from backend using shop slug
  let shopId = "";
  try {
    const res = await fetch(`${BACKEND_URL}/api/shops/${SHOP_SLUG}`);
    const data: any = await res.json();
    if (data.success && data.data) {
      shopId = data.data.id;
      console.log(`✅ Linked to Shop: "${data.data.name}" (ID: ${shopId})`);
    } else {
      console.warn(`Could not resolve shop with slug "${SHOP_SLUG}". Retrying on connection...`);
    }
  } catch (fetchErr) {
    console.warn("Backend server not yet reachable. Agent will retry automatically...");
  }

  // 3. Connect to WebSocket server
  socket = io(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 3000,
  });

  socket.on("connect", async () => {
    console.log(`🟢 Connected to PrintQueue Cloud (Socket: ${socket.id})`);

    if (!shopId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/shops/${SHOP_SLUG}`);
        const data: any = await res.json();
        if (data?.success && data?.data) {
          shopId = data.data.id;
          console.log(`✅ Linked to Shop: "${data.data.name}" (ID: ${shopId})`);
        }
      } catch (err) {
        // Will fallback to SHOP_SLUG which backend now resolves
      }
    }

    // Register this agent and its printers
    socket.emit("register_agent", {
      shopId: shopId || SHOP_SLUG,
      printers,
    });
  });

  socket.on("agent_registered", (res: any) => {
    console.log(`🎉 Agent successfully authenticated and listening for print jobs!`);
  });

  // 4. Listen for incoming print jobs dispatched when customers pay
  socket.on("print_job", async (jobData: any) => {
    const { jobId, orderId, orderCode, targetPrinterName, fileUrl, filename, printOptions } = jobData;

    console.log(`\n📄 [NEW PRINT JOB RECEIVED]`);
    console.log(`   Order Code: ${orderCode} (Job ID: ${jobId})`);
    console.log(`   Target Printer: ${targetPrinterName || "Default"}`);
    console.log(`   Options: ${printOptions.printMode.toUpperCase()}, ${printOptions.sided}, ${printOptions.copies} copy(ies)`);

    // Report status: printing
    socket.emit("job_status_update", { jobId, orderId, status: "printing" });

    try {
      // Download the document file from the cloud
      const downloadUrl = `${BACKEND_URL}${fileUrl}`;
      const localFilePath = path.join(DOWNLOAD_DIR, `${orderCode}-${Date.now()}-${filename}`);

      console.log(`   📥 Downloading document: ${downloadUrl}`);
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error(`Download failed with HTTP ${fileRes.status}`);

      const arrayBuffer = await fileRes.arrayBuffer();
      fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));
      console.log(`   💾 Document saved locally: ${localFilePath}`);

      // Spool to Windows printer
      const result = await submitPrintJob({
        filePath: localFilePath,
        printerName: targetPrinterName,
        copies: printOptions.copies || 1,
        printMode: printOptions.printMode,
      });

      if (result.success) {
        console.log(`   ✅ Print job spooled successfully!`);
        socket.emit("job_status_update", { jobId, orderId, status: "completed" });
      } else {
        throw new Error(result.message);
      }
    } catch (jobErr: any) {
      console.error(`   ❌ Failed to process print job:`, jobErr.message);
      socket.emit("job_status_update", {
        jobId,
        orderId,
        status: "failed",
        errorMessage: jobErr.message,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected from PrintQueue Cloud. Reconnecting in 3s...");
  });
}

startAgent();
