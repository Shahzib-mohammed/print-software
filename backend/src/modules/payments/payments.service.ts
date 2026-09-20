// ===================================================================
// Payments Service
// Manages online gateway sessions, webhooks, and offline counter confirmations
// ===================================================================

import { prisma } from "../../common/prisma";
import { CashfreeProvider } from "./cashfree.provider";
import { dispatchOrderToPrinter } from "../printers/printers.socket";

const gatewayProvider = new CashfreeProvider();

export class PaymentsService {
  /**
   * Initializes a payment session for an order
   */
  static async initiatePayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true },
    });

    if (!order) throw new Error("Order not found");

    // Create session via Cashfree
    const session = await gatewayProvider.createPaymentSession({
      orderId: order.id,
      amount: order.totalAmount,
      customerPhone: order.customerPhone || undefined,
      shopSubmerchantId: order.shop.gatewaySubmerchantId || undefined,
    });

    // Record initiated payment in database
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: "cashfree",
        gatewayOrderId: session.gatewayOrderId,
        amount: order.totalAmount,
        status: "initiated",
      },
    });

    return session;
  }

  /**
   * Confirms payment (called by Webhook or Mock Checkout Simulator)
   */
  static async markPaymentSuccess(params: {
    orderId: string;
    gatewayPaymentId: string;
    method?: string;
    rawPayload?: any;
  }) {
    const { orderId, gatewayPaymentId, method = "upi", rawPayload } = params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    // Idempotency check: if already paid, return early
    if (order.status === "paid" || order.status === "printing" || order.status === "completed") {
      return { success: true, message: "Order is already marked as paid", order };
    }

    // Update payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: "cashfree",
        gatewayPaymentId,
        amount: order.totalAmount,
        status: "success",
        method,
        rawWebhookPayload: rawPayload ? JSON.stringify(rawPayload) : undefined,
      },
    });

    // Update order status to paid
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "paid" },
    });

    // Auto-dispatch job to shop's local printer agent!
    await dispatchOrderToPrinter(orderId);

    return { success: true, message: "Payment verified and job released to printer", order: updatedOrder };
  }

  /**
   * Shopkeeper confirms an offline "Pay at Counter" order
   */
  static async confirmOfflinePayment(orderId: string, method: "cash" | "upi" | "split") {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    // Record offline payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: "offline",
        amount: order.totalAmount,
        status: "success",
        method,
        shopPayoutStatus: "settled",
      },
    });

    // Mark order as paid
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "paid", paymentMethod: method },
    });

    // Auto-dispatch job to printer!
    await dispatchOrderToPrinter(orderId);

    return { success: true, message: "Offline payment accepted, job sent to printer", order: updatedOrder };
  }
}
