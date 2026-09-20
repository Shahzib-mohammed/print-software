// ===================================================================
// Printer Agent WebSocket Gateway
// Handles real-time communication between the Cloud and Local Shop Agents
// ===================================================================

import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "../../common/prisma";

let ioInstance: SocketIOServer | null = null;

// Track connected shop agents: shopId -> Set of socket IDs
const connectedAgents = new Map<string, string>();

export function initPrinterSockets(io: SocketIOServer) {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    // Join order room for live tracking on customer screen
    socket.on("join_order", (orderId: string) => {
      socket.join(`order_${orderId}`);
      console.log(`Customer socket ${socket.id} joined room order_${orderId}`);
    });

    // Join shop room for live queue updates on shopkeeper admin
    socket.on("join_shop", (shopId: string) => {
      socket.join(`shop_${shopId}`);
      console.log(`Shopkeeper admin socket ${socket.id} joined room shop_${shopId}`);
    });

    // Local Printer Agent registration from Shop PC
    socket.on("register_agent", async (data: { shopId: string; printers?: any[] }) => {
      const { shopId, printers = [] } = data;
      // Find shop by ID or slug
      const shop = await prisma.shop.findFirst({
        where: { OR: [{ id: shopId }, { slug: shopId }] },
      });

      if (!shop) {
        console.warn(`⚠️ register_agent: Shop not found for identifier "${shopId}"`);
        socket.emit("agent_registered", { success: false, message: `Shop not found for "${shopId}"` });
        return;
      }

      const resolvedShopId = shop.id;
      connectedAgents.set(resolvedShopId, socket.id);
      socket.join(`shop_agent_${resolvedShopId}`);
      console.log(`🖨️ Local Printer Agent registered for Shop: ${shop.name} (${resolvedShopId})`);

      // Update printers in database as online
      try {
        if (printers.length > 0) {
          for (const p of printers) {
            await prisma.printer.upsert({
              where: { id: p.id || "temp_id" },
              update: { status: "online", lastSeenAt: new Date(), shopId: resolvedShopId },
              create: {
                shopId: resolvedShopId,
                name: p.name || "Default Printer",
                connectionType: p.connectionType || "wireless",
                printerType: p.printerType || "all",
                isDefault: p.isDefault ?? true,
                status: "online",
                lastSeenAt: new Date(),
              },
            });
          }
        }
      } catch (err) {
        console.warn("Could not upsert printer status:", err);
      }

      socket.emit("agent_registered", { success: true, message: "Agent successfully linked to cloud" });
    });

    // Agent reports status updates (e.g. "printing", "completed", "failed")
    socket.on("job_status_update", async (data: { jobId: string; orderId: string; status: string; errorMessage?: string }) => {
      const { jobId, orderId, status, errorMessage } = data;
      console.log(`🖨️ Agent reported job status: Job ${jobId} -> ${status}`);

      try {
        // Update PrintJob
        await prisma.printJob.update({
          where: { id: jobId },
          data: { status, errorMessage },
        });

        // Update Order if completed or printing
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status },
        });

        // Broadcast to customer and shopkeeper
        io.to(`order_${orderId}`).emit("order_status_updated", { orderId, status });
        io.to(`shop_${updatedOrder.shopId}`).emit("order_status_updated", { orderId, status });
      } catch (err) {
        console.error("Failed to process agent job status update:", err);
      }
    });

    socket.on("disconnect", () => {
      // Find if this was an agent
      for (const [shopId, sId] of connectedAgents.entries()) {
        if (sId === socket.id) {
          connectedAgents.delete(shopId);
          console.log(`⚠️ Local Printer Agent disconnected for Shop: ${shopId}`);
          break;
        }
      }
    });
  });
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Dispatches a paid order to the shop's Local Printer Agent
 */
export async function dispatchOrderToPrinter(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop: { include: { printers: true } },
      orderFiles: true,
      orderItems: true,
    },
  });

  if (!order || !order.orderFiles.length) {
    console.warn(`Cannot dispatch order ${orderId}: order or files not found`);
    return;
  }

  const printItem = order.orderItems.find((item) => item.type === "print");
  const file = order.orderFiles[0];

  // Smart dual-printer routing (Decision 4):
  // Check if job requires color, and find matching printer if available
  const isColor = printItem?.printMode === "color";
  let targetPrinter = order.shop.printers.find((p) => (isColor ? p.printerType === "color" : p.printerType === "bw"));

  // If specific printer type not found, fallback to default printer
  if (!targetPrinter) {
    targetPrinter = order.shop.printers.find((p) => p.isDefault) || order.shop.printers[0];
  }

  // Create PrintJob record
  const printJob = await prisma.printJob.create({
    data: {
      orderId: order.id,
      printerId: targetPrinter ? targetPrinter.id : null,
      status: "sent_to_agent",
    },
  });

  // Mark order as printing
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "printing" },
  });

  // Emit WebSocket event to the connected Shop Agent
  if (ioInstance) {
    ioInstance.to(`shop_agent_${order.shopId}`).emit("print_job", {
      jobId: printJob.id,
      orderId: order.id,
      orderCode: order.orderCode,
      targetPrinterName: targetPrinter ? targetPrinter.name : undefined,
      fileUrl: `/api/orders/download/${file.id}`,
      filename: file.originalFilename,
      printOptions: {
        printMode: printItem?.printMode || "bw",
        sided: printItem?.sided || "single",
        paperType: printItem?.paperType || "A4 70gsm",
        copies: printItem?.copies || 1,
        pageCount: file.pageCount,
      },
    });

    // Notify customer screen
    ioInstance.to(`order_${order.id}`).emit("order_status_updated", {
      orderId: order.id,
      status: "printing",
      orderCode: order.orderCode,
    });
  }

  console.log(`🚀 Dispatched Order ${order.orderCode} (Job ${printJob.id}) to agent for Shop: ${order.shop.name}`);
}
