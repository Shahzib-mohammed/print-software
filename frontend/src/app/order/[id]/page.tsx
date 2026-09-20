"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Download,
  ArrowLeft,
  Loader2,
  Sparkles,
  Receipt,
  Building2,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import confetti from "canvas-confetti";

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch order details
  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const res = await fetchApi(`/api/orders/${resolvedParams.id}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [resolvedParams.id]);

  // 2. Real-time WebSocket listener for order status changes
  useEffect(() => {
    if (!resolvedParams.id) return;
    const socket = getSocket();

    socket.emit("join_order", resolvedParams.id);

    socket.on("order_status_updated", (data: { orderId: string; status: string }) => {
      if (data.orderId === resolvedParams.id) {
        setOrder((prev: any) => (prev ? { ...prev, status: data.status } : prev));

        if (data.status === "completed") {
          try {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } catch (_) {}
        }
      }
    });

    return () => {
      socket.off("order_status_updated");
    };
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Retrieving order status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border max-w-md text-center">
          <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const status = order.status;
  const isPaid = ["paid", "printing", "completed"].includes(status);
  const isPrinting = ["printing", "completed"].includes(status);
  const isDone = status === "completed";

  const printItem = order.orderItems?.find((i: any) => i.type === "print");
  const file = order.orderFiles?.[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href={`/shop/${order.shop.slug}`} className="text-slate-500 hover:text-slate-800 flex items-center text-xs font-semibold">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>New Order</span>
          </Link>

          <span className="font-bold text-sm text-slate-900">{order.shop.name}</span>

          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Top Pickup Code Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center shadow-lg shadow-blue-500/5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl" />

          <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Order Pickup Code</p>
          <div className="my-2">
            <span className="text-5xl font-black tracking-wider text-blue-600 font-mono">{order.orderCode}</span>
          </div>
          <p className="text-xs text-slate-500">Show or tell this 4-digit code at the shop counter</p>

          {/* Status Badge */}
          <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize">
            {status === "pending_payment" && (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" /> Pay ₹{order.totalAmount} at counter
              </span>
            )}
            {status === "paid" && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Payment Confirmed (In Queue)
              </span>
            )}
            {status === "printing" && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center animate-pulse">
                <Printer className="w-3.5 h-3.5 mr-1" /> Printing Now on Shop PC...
              </span>
            )}
            {status === "completed" && (
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Ready for Pickup!
              </span>
            )}
          </div>
        </div>

        {/* Live Stepper */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Live Print Progress</h3>

          <div className="space-y-4 text-left">
            {/* Step 1: Order Received */}
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Document Uploaded</p>
                <p className="text-xs text-slate-500">{file?.originalFilename || "Document"}</p>
              </div>
            </div>

            {/* Step 2: Payment */}
            <div className="flex items-start space-x-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isPaid ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">
                  {isPaid ? "Payment Verified" : "Waiting for Shopkeeper Payment Confirmation"}
                </p>
                <p className="text-xs text-slate-500">
                  {isPaid
                    ? `Amount ₹${order.totalAmount.toFixed(2)} received`
                    : "Pay cash at counter — shopkeeper will click confirm to start printing"}
                </p>
              </div>
            </div>

            {/* Step 3: Printing */}
            <div className="flex items-start space-x-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isPrinting
                    ? "bg-purple-600 text-white animate-pulse"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">
                  {isDone ? "Printed" : isPrinting ? "Printing to Shop Printer..." : "Sent to Printer Queue"}
                </p>
                <p className="text-xs text-slate-500">
                  {printItem ? `${printItem.printMode.toUpperCase()} • ${printItem.sided} • ${printItem.copies} copies` : ""}
                </p>
              </div>
            </div>

            {/* Step 4: Ready */}
            <div className="flex items-start space-x-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone ? "bg-emerald-500 text-white ring-4 ring-emerald-100" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Ready for Collection</p>
                <p className="text-xs text-slate-500">Pick up your document from the counter</p>
              </div>
            </div>
          </div>
        </section>

        {/* Digital Receipt Summary */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Digital Receipt</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">#{order.id.slice(0, 8)}</span>
          </div>

          <div className="divide-y text-xs text-slate-700">
            {order.orderItems?.map((item: any) => (
              <div key={item.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {item.type === "print" ? `Document Print (${item.printMode.toUpperCase()}, ${item.sided})` : "Add-on"}
                  </span>
                  <span className="text-slate-400">
                    {item.copies} {item.copies === 1 ? "unit" : "units"} × ₹{item.unitPrice.toFixed(2)}
                  </span>
                </div>
                <span className="font-bold text-slate-900">₹{item.lineTotal.toFixed(2)}</span>
              </div>
            ))}

            <div className="pt-2.5 flex items-center justify-between font-bold text-sm text-slate-900">
              <span>Total Paid</span>
              <span className="text-base text-blue-600">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Privacy auto-deletion notice */}
        <div className="p-4 rounded-xl bg-slate-100 text-slate-500 text-xs flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Privacy Protected: Your file is scheduled for automatic permanent deletion within {order.shop.retentionHours || 25} hours.
          </span>
        </div>
      </main>
    </div>
  );
}
