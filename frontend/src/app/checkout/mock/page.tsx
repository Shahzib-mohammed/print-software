"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  QrCode,
  Smartphone,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  Info,
  Sun,
  Moon,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import confetti from "canvas-confetti";

interface OrderDetails {
  id: string;
  orderCode: string;
  totalAmount: number;
  status: string;
  customerPhone?: string;
  shop?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  orderItems?: any[];
  orderFiles?: Array<{
    originalFilename: string;
    pageCount: number;
  }>;
}

type UpiSubTab = "apps" | "qr" | "vpa";

function MockCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") || "";
  const initialAmount = searchParams.get("amount") || "60.00";

  // Theme state: "dark" or "light"
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load theme preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("printqueue_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("printqueue_theme", next);
  };

  // Data fetching
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // UPI Selection
  const [upiSubTab, setUpiSubTab] = useState<UpiSubTab>("apps");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);

  // UI state
  const [showOrderBreakdown, setShowOrderBreakdown] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // QR Timer
  const [qrSecondsLeft, setQrSecondsLeft] = useState(298);

  // Interactive Simulation Modal
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState<"connecting" | "pending_approval" | "success" | "failed">("connecting");
  const [simErrorMessage, setSimErrorMessage] = useState("");

  // Amount formatting
  const displayAmount = order?.totalAmount
    ? Number(order.totalAmount).toFixed(2)
    : Number(initialAmount).toFixed(2);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load real order info if available
  useEffect(() => {
    if (!orderId) {
      setLoadingOrder(false);
      return;
    }

    async function loadOrder() {
      try {
        const res = await fetchApi<OrderDetails>(`/api/orders/${orderId}`);
        if (res.success && res.data) {
          setOrder(res.data);
        }
      } catch (err) {
        console.warn("Order details not fetched, falling back to query amount:", err);
      } finally {
        setLoadingOrder(false);
      }
    }
    loadOrder();
  }, [orderId]);

  // Dynamic QR countdown timer
  useEffect(() => {
    if (upiSubTab !== "qr") return;
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [upiSubTab]);

  // Format MM:SS for QR
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Copy Order Code
  const handleCopyCode = () => {
    const code = order?.orderCode || "FP48";
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Order Code ${code} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Trigger Simulation Overlay
  const startPaymentSimulation = () => {
    setSimulating(true);
    setSimStep("connecting");
    setSimErrorMessage("");

    setTimeout(() => {
      setSimStep("pending_approval");
    }, 1100);
  };

  // Simulate Payment Success
  const handleConfirmSuccess = async () => {
    if (!orderId) {
      showToast("Missing Order ID parameter");
      return;
    }

    try {
      setSimStep("connecting");
      await fetchApi("/api/payments/mock-success", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          method: `upi_${upiSubTab === "apps" ? selectedUpiApp : upiSubTab}`,
        }),
      });

      setSimStep("success");
      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#3b82f6", "#60a5fa", "#818cf8"],
        });
      } catch (_) {}

      setTimeout(() => {
        router.push(`/order/${orderId}`);
      }, 1500);
    } catch (err: any) {
      setSimStep("failed");
      setSimErrorMessage(err.message || "Failed to process payment with bank");
    }
  };

  // Simulate Bank Decline / Timeout
  const handleSimulateDecline = () => {
    setSimStep("failed");
    setSimErrorMessage("Payment authorization declined by issuer bank (Code: CF_DECLINED_102).");
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 lg:p-6 antialiased relative ${
        isDark
          ? "bg-slate-950 text-slate-100 selection:bg-blue-500/30"
          : "bg-slate-100 text-slate-900 selection:bg-blue-500/20"
      }`}
    >
      {/* Background Ambient Glow */}
      {isDark ? (
        <>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Floating In-App Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-xs font-semibold max-w-[90vw] ${
            isDark
              ? "bg-slate-900 border border-blue-500/50 text-blue-300"
              : "bg-white border border-blue-500/40 text-blue-700 shadow-blue-500/10"
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card: Full width on mobile, max-xl on desktop */}
      <div
        className={`w-full max-w-xl transition-colors duration-300 sm:border sm:rounded-3xl sm:shadow-2xl overflow-hidden backdrop-blur-xl relative z-10 flex flex-col ${
          isDark
            ? "bg-slate-900 sm:border-slate-800/90 sm:shadow-black/60"
            : "bg-white sm:border-slate-200 sm:shadow-slate-300/60"
        }`}
      >
        {/* Top Navbar / Header with Theme Button */}
        <div
          className={`sticky top-0 z-20 px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-2 backdrop-blur-md transition-colors duration-300 ${
            isDark
              ? "bg-slate-950/90 border-slate-800/80"
              : "bg-white/95 border-slate-200"
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              onClick={() => router.back()}
              className={`p-2 -ml-1 rounded-xl transition-colors flex-shrink-0 ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30 flex-shrink-0">
                CF
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1 truncate">
                  <span className={`font-extrabold text-sm tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Cashfree
                  </span>
                  <span className={`text-xs font-light ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Payments
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Actions: Sandbox Badge & Theme Switcher Button */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isDark
                  ? "bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200"
                  : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
              }`}
              title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden xs:inline text-[11px]">Dark</span>
                </>
              )}
            </button>

            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5" />
              TEST MODE
            </span>
          </div>
        </div>

        {/* Mobile Compact Order Header Card */}
        <div
          className={`px-4 py-3.5 border-b flex items-center justify-between transition-colors duration-300 ${
            isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span>Pay to:</span>
              <span className={`font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {order?.shop?.name || "FastPrint Express"}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-500/20 flex-shrink-0" />
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className={`text-[11px] font-mono font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                Order #{order?.orderCode || "FP48"}
              </span>
              <button
                onClick={handleCopyCode}
                className={`text-[10px] flex items-center space-x-0.5 transition-colors ${
                  isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {copiedCode ? <Check className="w-3 h-3 text-blue-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <button
              onClick={() => setShowOrderBreakdown(!showOrderBreakdown)}
              className="flex items-center space-x-1 text-right group"
            >
              <div>
                <span className="text-[10px] text-slate-400 block -mb-0.5">Total Amount</span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  ₹{displayAmount}
                </span>
              </div>
              {showOrderBreakdown ? (
                <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Order Itemized Breakdown */}
        {showOrderBreakdown && (
          <div
            className={`px-4 py-3 border-b space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
              isDark ? "bg-slate-950/90 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Order Breakdown
            </span>
            {order?.orderFiles && order.orderFiles.length > 0 ? (
              order.orderFiles.map((f, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="truncate max-w-[220px] flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{f.originalFilename}</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{f.pageCount} page(s)</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center">
                <span>Self-Service Document Print</span>
                <span>₹{displayAmount}</span>
              </div>
            )}
            <div
              className={`flex justify-between items-center pt-2 border-t font-medium ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <span>Convenience & Platform Fee</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">FREE (₹0.00)</span>
            </div>
          </div>
        )}

        {/* UPI Payment Flow */}
        <div className="p-4 sm:p-6 pb-28 sm:pb-6 flex-1 space-y-5">
          {/* UPI Navigation Sub-tabs: Mobile touch-friendly */}
          <div
            className={`flex items-center space-x-2 border-b pb-2.5 text-xs overflow-x-auto scrollbar-none ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setUpiSubTab("apps")}
              className={`pb-1 px-1 font-bold whitespace-nowrap transition-colors relative flex-shrink-0 ${
                upiSubTab === "apps"
                  ? "text-blue-600 dark:text-blue-400"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              UPI Apps (GPay/PhonePe)
              {upiSubTab === "apps" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setUpiSubTab("qr")}
              className={`pb-1 px-1 font-bold whitespace-nowrap transition-colors relative flex-shrink-0 ${
                upiSubTab === "qr"
                  ? "text-blue-600 dark:text-blue-400"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Scan Dynamic QR
              {upiSubTab === "qr" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setUpiSubTab("vpa")}
              className={`pb-1 px-1 font-bold whitespace-nowrap transition-colors relative flex-shrink-0 ${
                upiSubTab === "vpa"
                  ? "text-blue-600 dark:text-blue-400"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Enter UPI ID (VPA)
              {upiSubTab === "vpa" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          </div>

          {/* SubTab 1: UPI Apps Grid */}
          {upiSubTab === "apps" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "gpay", name: "Google Pay", desc: "Fast 1-tap debit", color: "from-blue-600 to-indigo-600", tag: "POPULAR" },
                  { id: "phonepe", name: "PhonePe", desc: "Instant UPI Direct", color: "from-purple-600 to-indigo-700", tag: "FASTEST" },
                  { id: "paytm", name: "Paytm UPI", desc: "Paytm Bank / UPI", color: "from-sky-500 to-blue-600" },
                  { id: "bhim", name: "BHIM UPI", desc: "NPCI Official", color: "from-teal-600 to-blue-700" },
                  { id: "cred", name: "CRED UPI", desc: "Earn cashback", color: "from-neutral-800 to-neutral-950" },
                  { id: "navi", name: "Navi UPI", desc: "Zero failure rate", color: "from-amber-600 to-orange-700" },
                ].map((app) => {
                  const isSelected = selectedUpiApp === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between active:scale-[0.98] ${
                        isSelected
                          ? isDark
                            ? "border-blue-500 bg-blue-500/10 shadow-md shadow-blue-500/15 ring-1 ring-blue-500"
                            : "border-blue-600 bg-blue-50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500"
                          : isDark
                          ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${app.color} flex items-center justify-center font-black text-white text-xs shadow-sm flex-shrink-0`}>
                            {app.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-xs truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                              {app.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{app.desc}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-1" />
                        )}
                      </div>

                      {app.tag && (
                        <span
                          className={`self-start mt-2 px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            isDark
                              ? "bg-slate-800 border-slate-700 text-slate-300"
                              : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          {app.tag}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                className={`p-3 border rounded-xl text-[11px] flex items-center space-x-2 ${
                  isDark
                    ? "bg-slate-950/60 border-slate-800 text-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Selected app will open or receive an instant UPI collect request.</span>
              </div>
            </div>
          )}

          {/* SubTab 2: Dynamic QR Code */}
          {upiSubTab === "qr" && (
            <div
              className={`border rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center space-y-3 text-center transition-colors ${
                isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="relative group">
                <div
                  className={`w-44 h-44 bg-white p-2.5 rounded-2xl shadow-xl border-4 relative flex items-center justify-center overflow-hidden ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  {/* Animated Radar Scanning Line */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent w-full h-8 animate-pulse pointer-events-none" />

                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" fill="#0f172a" />
                    <path d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" fill="#0f172a" />
                    <path d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" fill="#0f172a" />
                    <rect x="38" y="8" width="6" height="6" fill="#0f172a" />
                    <rect x="48" y="18" width="6" height="6" fill="#0f172a" />
                    <rect x="12" y="38" width="6" height="6" fill="#0f172a" />
                    <rect x="22" y="48" width="6" height="6" fill="#0f172a" />
                    <rect x="42" y="38" width="16" height="16" rx="4" fill="#2563eb" />
                    <rect x="68" y="38" width="8" height="8" fill="#0f172a" />
                    <rect x="80" y="48" width="12" height="6" fill="#0f172a" />
                    <rect x="38" y="68" width="6" height="12" fill="#0f172a" />
                    <rect x="52" y="78" width="12" height="6" fill="#0f172a" />
                    <rect x="74" y="74" width="16" height="16" fill="#0f172a" />
                  </svg>

                  <div className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-white font-extrabold text-xs shadow-lg">
                    ₹
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Scan with any UPI App on your phone
                </p>
                <p className="text-[11px] text-slate-400">
                  QR expires in: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatTimer(qrSecondsLeft)}</span>
                </p>
              </div>
            </div>
          )}

          {/* SubTab 3: Enter UPI ID */}
          {upiSubTab === "vpa" && (
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Enter UPI ID / VPA
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="mobile@paytm"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      setUpiVerified(e.target.value.includes("@"));
                    }}
                    className={`flex-1 border rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? "bg-slate-950/90 border-slate-800 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (upiId.includes("@")) {
                        setUpiVerified(true);
                        showToast("UPI ID verified successfully!");
                      } else {
                        showToast("Please enter a valid handle (e.g. name@okhdfcbank)");
                      }
                    }}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-colors flex-shrink-0 ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                    }`}
                  >
                    Verify
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Quick handles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["@okhdfcbank", "@paytm", "@ybl", "@okaxis", "@ibl"].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => {
                        const base = upiId.split("@")[0] || "9876543210";
                        setUpiId(`${base}${handle}`);
                        setUpiVerified(true);
                      }}
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-colors ${
                        isDark
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/70"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trust badges footer inside scroll area */}
          <div
            className={`pt-3 border-t flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 text-center ${
              isDark ? "border-slate-800/80" : "border-slate-200"
            }`}
          >
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span>PCI-DSS Level 1 Certified</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Files Auto-Purged in 25 hrs</span>
            </span>
          </div>
        </div>

        {/* Sticky Mobile Bottom Bar / Desktop Footer */}
        <div
          className={`fixed sm:static bottom-0 left-0 right-0 z-30 p-3 sm:p-4 border-t backdrop-blur-xl transition-colors duration-300 ${
            isDark
              ? "bg-slate-950/95 sm:bg-slate-950/60 border-slate-800/90"
              : "bg-white/95 sm:bg-white/90 border-slate-200 shadow-lg sm:shadow-none"
          }`}
        >
          <div className="max-w-md mx-auto sm:max-w-none">
            <button
              type="button"
              onClick={startPaymentSimulation}
              className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-[0.98] ${
                isDark
                  ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Pay ₹{displayAmount} Securely</span>
            </button>
            <div className="flex items-center justify-center space-x-2 mt-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span>Cashfree 256-Bit SSL Protection • Instant Print Release</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PAYMENT SIMULATION MODAL OVERLAY (THEME AWARE) */}
      {/* =================================================================== */}
      {simulating && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            className={`w-full sm:max-w-md border-t sm:border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-center max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Step: Connecting / Sending Request */}
            {simStep === "connecting" && (
              <div className="py-6 space-y-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <Smartphone className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Contacting Bank Gateway...
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Initiating secure session for ₹{displayAmount}</p>
                </div>
              </div>
            )}

            {/* Step: Waiting for Customer Confirmation */}
            {simStep === "pending_approval" && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 mx-auto flex items-center justify-center text-blue-500">
                  <Smartphone className="w-6 h-6 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500">
                    AWAITING UPI CONFIRMATION
                  </span>
                  <h3 className={`text-base font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Approve on Your Phone
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    A payment collect request for <span className="font-bold">₹{displayAmount}</span> has been sent.
                  </p>
                </div>

                <div
                  className={`border rounded-2xl p-3 text-xs space-y-1 text-left font-mono ${
                    isDark ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Code:</span>
                    <span className="text-blue-500 font-bold">#{order?.orderCode || "FP48"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Due:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">₹{displayAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gateway Ref:</span>
                    <span className="truncate max-w-[140px]">CF_TXN_{orderId.slice(0, 8)}</span>
                  </div>
                </div>

                {/* Simulation Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmSuccess}
                    className="w-full py-3.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-[0.98] bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Payment Approval (Success)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateDecline}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-colors active:scale-[0.98] ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    Simulate Bank Decline
                  </button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {simStep === "success" && (
              <div className="py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500 mx-auto flex items-center justify-center text-blue-500 animate-in zoom-in-50">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                    Payment Successful!
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">₹{displayAmount} debited successfully</p>
                  <p className="text-xs text-slate-400">Releasing print job to local printer queue...</p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Redirecting to live tracker...</span>
                </div>
              </div>
            )}

            {/* Step: Failed */}
            {simStep === "failed" && (
              <div className="py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500 mx-auto flex items-center justify-center text-red-500">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Transaction Failed
                  </h3>
                  <p className="text-xs text-red-500">{simErrorMessage || "The payment could not be processed."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulating(false)}
                  className={`w-full py-3 rounded-xl font-bold text-xs border transition-colors ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                  }`}
                >
                  Return to Payment Options
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading secure payment session...</span>
          </div>
        </div>
      }
    >
      <MockCheckoutContent />
    </Suspense>
  );
}
