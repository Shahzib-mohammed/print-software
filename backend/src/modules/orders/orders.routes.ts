// ===================================================================
// Orders API Routes
// ===================================================================

import { Router, Request, Response } from "express";
import { OrdersService } from "./orders.service";
import { upload } from "../../common/upload";
import { analyzeDocument } from "../../common/pageCounter";
import { sendSuccess, sendError } from "../../common/response";
import { getSocketIO } from "../printers/printers.socket";

const router = Router();

// POST /api/orders/upload-and-analyze — Uploads file and returns page count
router.post("/upload-and-analyze", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const analysis = await analyzeDocument(req.file.path);

    return sendSuccess(res, "File uploaded and analyzed", {
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      storageKey: req.file.path,
      size: req.file.size,
      pageCount: analysis.pageCount,
      format: analysis.format,
    });
  } catch (err: any) {
    return sendError(res, "Failed to analyze document", 500, err.message);
  }
});

// POST /api/orders — Finalize order creation
router.post("/", async (req: Request, res: Response) => {
  try {
    const { shopId, customerPhone, paymentMethod, printOptions, fileInfo, selectedProducts } = req.body;

    if (!shopId || !printOptions || !fileInfo) {
      return sendError(res, "shopId, printOptions, and fileInfo are required", 400);
    }

    const result = await OrdersService.createOrder({
      shopId,
      customerPhone,
      paymentMethod: paymentMethod || "online",
      printOptions,
      fileInfo,
      selectedProducts,
    });

    // Notify shopkeeper admin via WebSockets about new order
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("new_order", {
          order: result.order,
          orderFile: result.orderFile,
        });
      }
    } catch (socketErr) {
      console.warn("Socket broadcast notification skipped:", socketErr);
    }

    return sendSuccess(res, "Order created successfully", result, 201);
  } catch (err: any) {
    return sendError(res, "Failed to create order", 500, err.message);
  }
});

// GET /api/orders/:id — Retrieve order by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await OrdersService.getOrderById(id);

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    return sendSuccess(res, "Order retrieved", order);
  } catch (err: any) {
    return sendError(res, "Failed to retrieve order", 500, err.message);
  }
});

// GET /api/orders/shop/:shopId — Shop live queue & history
router.get("/shop/:shopId", async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { status } = req.query;
    const data = await OrdersService.getOrdersByShop(shopId, status as string);
    return sendSuccess(res, "Shop orders retrieved", data);
  } catch (err: any) {
    return sendError(res, "Failed to retrieve shop orders", 500, err.message);
  }
});

// PATCH /api/orders/:id/status — Update order status (confirm payment, mark completed, etc.)
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendError(res, "Status is required", 400);
    }

    const updated = await OrdersService.updateOrderStatus(id, status);

    // Broadcast status change to customer and shopkeeper
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`order_${id}`).emit("order_status_updated", { orderId: id, status });
        io.to(`shop_${updated.shopId}`).emit("order_status_updated", { orderId: id, status });
      }
    } catch (socketErr) {
      console.warn("Socket notification skipped:", socketErr);
    }

    return sendSuccess(res, `Order marked as ${status}`, updated);
  } catch (err: any) {
    return sendError(res, "Failed to update order status", 500, err.message);
  }
});

export default router;
