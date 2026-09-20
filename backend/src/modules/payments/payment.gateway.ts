// ===================================================================
// Pluggable Payment Gateway Interface
// Allows Cashfree, Razorpay, or individual shopkeeper gateways to be swapped easily
// ===================================================================

export interface PaymentSessionResult {
  paymentId: string;
  gatewayOrderId: string;
  checkoutUrl?: string;
  paymentSessionId?: string;
  mode: "mock" | "sandbox" | "live";
}

export interface PaymentGatewayProvider {
  createPaymentSession(params: {
    orderId: string;
    amount: number;
    currency?: string;
    customerPhone?: string;
    shopSubmerchantId?: string;
  }): Promise<PaymentSessionResult>;

  verifyWebhookSignature(payload: any, signature?: string): boolean;
}
