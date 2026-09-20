// ===================================================================
// Payments API Routes
// ===================================================================

import { Router, Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { sendSuccess, sendError } from "../../common/response";

const router = Router();

// POST /api/payments/initiate — Start payment for an order
router.post("/initiate", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return sendError(res, "orderId is required", 400);
    }

    const session = await PaymentsService.initiatePayment(orderId);
    return sendSuccess(res, "Payment session created", session);
  } catch (err: any) {
    return sendError(res, "Failed to initiate payment", 500, err.message);
  }
});

// POST /api/payments/mock-success — Mock payment completion for testing in local dev
router.post("/mock-success", async (req: Request, res: Response) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId) {
      return sendError(res, "orderId is required", 400);
    }

    const result = await PaymentsService.markPaymentSuccess({
      orderId,
      gatewayPaymentId: `mock_pay_${Date.now()}`,
      method: method || "upi",
    });

    return sendSuccess(res, result.message, result.order);
  } catch (err: any) {
    return sendError(res, "Failed to complete mock payment", 500, err.message);
  }
});

// POST /api/payments/webhook — Real Cashfree Webhook endpoint
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log("🔔 Received Cashfree Webhook:", payload);

    const orderId = payload?.data?.order?.order_id;
    const paymentStatus = payload?.data?.payment?.payment_status;
    const paymentId = payload?.data?.payment?.cf_payment_id;

    if (orderId && paymentStatus === "SUCCESS") {
      await PaymentsService.markPaymentSuccess({
        orderId,
        gatewayPaymentId: String(paymentId || Date.now()),
        method: payload?.data?.payment?.payment_group || "upi",
        rawPayload: payload,
      });
    }

    return res.status(200).json({ status: "OK" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/confirm-offline — Shopkeeper accepts payment at counter
router.post("/confirm-offline", async (req: Request, res: Response) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId) {
      return sendError(res, "orderId is required", 400);
    }

    const result = await PaymentsService.confirmOfflinePayment(orderId, method || "cash");
    return sendSuccess(res, result.message, result.order);
  } catch (err: any) {
    return sendError(res, "Failed to confirm offline payment", 500, err.message);
  }
});

export default router;
