"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  UploadCloud,
  FileText,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL, fetchApi } from "@/lib/api";

interface ShopData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  retentionHours: number;
  priceRules: any[];
  products: any[];
}

interface UploadedFileInfo {
  filename: string;
  originalFilename: string;
  storageKey: string;
  size: number;
  pageCount: number;
  format: string;
}

export default function ShopOrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState<UploadedFileInfo | null>(null);

  // Print configuration
  const [printMode, setPrintMode] = useState<"bw" | "color">("bw");
  const [sided, setSided] = useState<"single" | "double">("single");
  const [paperType, setPaperType] = useState<string>("A4 70gsm");
  const [copies, setCopies] = useState<number>(1);
  const [customerPhone, setCustomerPhone] = useState("");

  // Add-ons selected: Map of productId -> quantity
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  // Pricing calculation
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [priceData, setPriceData] = useState<{
    pricePerPage: number;
    printTotal: number;
    productsTotal: number;
    grandTotal: number;
  } | null>(null);

  // Submitting order
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch shop by slug
  useEffect(() => {
    async function loadShop() {
      try {
        setLoadingShop(true);
        const res = await fetchApi<ShopData>(`/api/shops/${resolvedParams.slug}`);
        setShop(res.data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load shop details");
      } finally {
        setLoadingShop(false);
      }
    }
    loadShop();
  }, [resolvedParams.slug]);

  // 2. Handle File Selection & Auto-Analysis
  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${API_BASE_URL}/api/orders/upload-and-analyze`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setUploadedInfo(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload file");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  // 3. Recalculate price whenever options, copies, or add-ons change
  useEffect(() => {
    const shopId = shop?.id;
    const pageCount = uploadedInfo?.pageCount;
    if (!shopId || !pageCount) return;

    async function updatePrice() {
      try {
        setCalculatingPrice(true);
        const productList = Object.entries(selectedProducts)
          .filter(([_, qty]) => qty > 0)
          .map(([productId, quantity]) => ({ productId, quantity }));

        const res = await fetchApi("/api/pricing/calculate", {
          method: "POST",
          body: JSON.stringify({
            shopId,
            pageCount,
            copies,
            printMode,
            sided,
            paperType,
            selectedProducts: productList,
          }),
        });

        setPriceData(res.data);
      } catch (err) {
        console.warn("Pricing calculation error:", err);
      } finally {
        setCalculatingPrice(false);
      }
    }

    updatePrice();
  }, [shop, uploadedInfo, printMode, sided, paperType, copies, selectedProducts]);

  // Helper to toggle add-on product
  function toggleProduct(productId: string) {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: prev[productId] ? 0 : 1,
    }));
  }

  // 4. Place Order (Online or Counter)
  async function handlePlaceOrder(paymentMethod: "online" | "cash") {
    if (!shop || !uploadedInfo) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const productList = Object.entries(selectedProducts)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));

      const orderPayload = {
        shopId: shop.id,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        printOptions: {
          printMode,
          sided,
          paperType,
          copies,
          pageCount: uploadedInfo.pageCount,
        },
        fileInfo: {
          originalFilename: uploadedInfo.originalFilename,
          storageKey: uploadedInfo.storageKey,
          pageCount: uploadedInfo.pageCount,
        },
        selectedProducts: productList,
      };

      const res = await fetchApi("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      const orderId = res.data.order.id;

      if (paymentMethod === "online") {
        // Initiate Cashfree payment session
        const payRes = await fetchApi("/api/payments/initiate", {
          method: "POST",
          body: JSON.stringify({ orderId }),
        });

        if (payRes.data.checkoutUrl) {
          window.location.href = payRes.data.checkoutUrl;
        } else {
          router.push(`/order/${orderId}`);
        }
      } else {
        // Pay at counter — redirect to order code screen
        router.push(`/order/${orderId}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit order");
      setSubmitting(false);
    }
  }

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Connecting to print counter...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Shop Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">
            The QR code or link you opened is invalid. Please scan the QR code displayed at the print shop counter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight">{shop.name}</h1>
              <p className="text-xs text-emerald-600 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Live Self-Service Counter
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>25h Auto-Purge</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: File Upload */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 mb-3 flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
            <span>Upload Document to Print</span>
          </h2>

          {!uploadedInfo ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              {uploading ? (
                <div className="flex flex-col items-center space-y-2 py-2">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="text-sm font-semibold text-slate-700">Analyzing document & counting pages...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm text-slate-800">Tap to upload file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, Word (.docx), or Images</p>
                </>
              )}
            </label>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-slate-900 truncate">{uploadedInfo.originalFilename}</p>
                  <p className="text-xs text-blue-700 font-semibold">
                    {uploadedInfo.pageCount} {uploadedInfo.pageCount === 1 ? "page" : "pages"} detected • {(uploadedInfo.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setUploadedInfo(null);
                }}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium underline ml-2 shrink-0"
              >
                Change
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Print Options (Visible once document is uploaded) */}
        {uploadedInfo && (
          <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
              <span>Configure Print Options</span>
            </h2>

            {/* Print Mode: B&W vs Color */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Color Mode</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrintMode("bw")}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    printMode === "bw" ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Black & White</span>
                    <span className="text-xs text-slate-500">Standard documents</span>
                  </div>
                  {printMode === "bw" && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPrintMode("color")}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    printMode === "color" ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 flex items-center">
                      Full Color <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-1" />
                    </span>
                    <span className="text-xs text-slate-500">Photos, certificates</span>
                  </div>
                  {printMode === "color" && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* Sides: Single vs Double */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Print Sides</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSided("single")}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    sided === "single" ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Single-Sided</span>
                    <span className="text-xs text-slate-500">1 side per page</span>
                  </div>
                  {sided === "single" && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSided("double")}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    sided === "double" ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Double-Sided</span>
                    <span className="text-xs text-slate-500">Back-to-back (eco)</span>
                  </div>
                  {sided === "double" && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* Paper Type & Copies */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Paper Type</label>
                <select
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="A4 70gsm">A4 Standard (70gsm)</option>
                  <option value="A4 Glossy">A4 Glossy Photo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Copies</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCopies((c) => Math.max(1, c - 1))}
                    className="p-2.5 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center font-bold text-sm text-slate-900">{copies}</span>
                  <button
                    type="button"
                    onClick={() => setCopies((c) => c + 1)}
                    className="p-2.5 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Add-on Products (Binding, pens, folders) */}
        {uploadedInfo && shop.products && shop.products.length > 0 && (
          <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h2 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                <span>Add Stationery or Binding (Optional)</span>
              </span>
            </h2>

            <div className="space-y-2">
              {shop.products.map((prod) => {
                const isSelected = Boolean(selectedProducts[prod.id]);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleProduct(prod.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{prod.name}</p>
                      {prod.variant && <p className="text-xs text-slate-500">{prod.variant}</p>}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-sm text-slate-900">₹{prod.price}</span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 4: Optional Phone Number */}
        {uploadedInfo && (
          <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">Mobile Number (Optional)</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-slate-400">Used only to send digital receipt and lookup your order code.</p>
          </section>
        )}
      </main>

      {/* Pinned Bottom Checkout Bar */}
      {uploadedInfo && priceData && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 z-50 shadow-2xl">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 block">Total Amount</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-slate-900">₹{priceData.grandTotal.toFixed(2)}</span>
                <span className="text-xs text-slate-400">({uploadedInfo.pageCount * copies} pages)</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePlaceOrder("cash")}
                className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors flex items-center space-x-1.5 shrink-0"
              >
                <Banknote className="w-4 h-4 text-slate-600" />
                <span>Pay at Counter</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePlaceOrder("online")}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center space-x-1.5 shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Online (UPI)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
