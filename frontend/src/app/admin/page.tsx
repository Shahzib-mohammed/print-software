"use client";

import { useEffect, useState } from "react";
import {
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Check,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function ShopAdminDashboard() {
  const [shopSlug, setShopSlug] = useState("fastprint");
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Theme state: "light" or "dark" (persisted in localStorage)
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  const isDark = theme === "dark";

  // Tabs: queue, pricing, products, printers
  const [activeTab, setActiveTab] = useState<"queue" | "pricing" | "products" | "printers">("queue");

  // Orders & metrics
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    todayRevenue: 0,
    todayPrints: 0,
    monthRevenue: 0,
    monthPrints: 0,
  });
  const [queueFilter, setQueueFilter] = useState("all");

  // Pricing rules
  const [priceRules, setPriceRules] = useState<any[]>([]);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  // 1. Initial Data Load
  async function loadDashboardData() {
    try {
      setLoading(true);
      const shopRes = await fetchApi(`/api/shops/${shopSlug}`);
      const shopData = shopRes.data;
      setShop(shopData);

      // Load shop orders and stats
      const ordersRes = await fetchApi(`/api/orders/shop/${shopData.id}`);
      setOrders(ordersRes.data.orders);
      setSummary(ordersRes.data.summary);

      // Load price rules
      const rulesRes = await fetchApi(`/api/pricing/shop/${shopData.id}`);
      setPriceRules(rulesRes.data);

      // Load products
      const prodRes = await fetchApi(`/api/products/shop/${shopData.id}`);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [shopSlug]);

  // 2. Real-time WebSocket updates for live queue
  useEffect(() => {
    if (!shop?.id) return;
    const socket = getSocket();

    socket.emit("join_shop", shop.id);

    socket.on("new_order", (data: any) => {
      setOrders((prev) => [data.order, ...prev]);
    });

    socket.on("order_status_updated", (data: { orderId: string; status: string }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
      );
    });

    return () => {
      socket.off("new_order");
      socket.off("order_status_updated");
    };
  }, [shop?.id]);

  // 3. Confirm offline cash payment
  async function handleConfirmPayment(orderId: string) {
    try {
      await fetchApi("/api/payments/confirm-offline", {
        method: "POST",
        body: JSON.stringify({ orderId, method: "cash" }),
      });
      loadDashboardData();
    } catch (err: any) {
      alert("Error confirming payment: " + err.message);
    }
  }

  // 4. Update Price Rule
  async function handleSavePriceRule(ruleId: string, pricePerPage: number) {
    setSavingRuleId(ruleId);
    try {
      await fetchApi(`/api/pricing/rule/${ruleId}`, {
        method: "PATCH",
        body: JSON.stringify({ pricePerPage }),
      });
      alert("Price rule saved successfully!");
    } catch (err: any) {
      alert("Failed to update rule: " + err.message);
    } finally {
      setSavingRuleId(null);
    }
  }

  // 5. Add Product
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;

    try {
      const res = await fetchApi("/api/products", {
        method: "POST",
        body: JSON.stringify({
          shopId: shop.id,
          name: newProductName,
          price: parseFloat(newProductPrice),
        }),
      });
      setProducts([...products, res.data]);
      setNewProductName("");
      setNewProductPrice("");
    } catch (err: any) {
      alert("Failed to add product: " + err.message);
    }
  }

  // 6. Delete Product
  async function handleDeleteProduct(id: string) {
    try {
      await fetchApi(`/api/products/${id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
    }
  }

  if (loading && !shop) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isDark ? "bg-slate-950 text-slate-200" : "bg-slate-100 text-slate-800"}`}>
        <p className="text-sm font-semibold">Loading Shopkeeper Dashboard...</p>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (queueFilter === "pending") return o.status === "pending_payment";
    if (queueFilter === "printing") return o.status === "printing";
    if (queueFilter === "completed") return o.status === "completed";
    return true;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-16 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-40 transition-colors duration-300 border-b ${isDark ? "bg-slate-900/95 border-slate-800 text-white backdrop-blur-md" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">{shop?.name || "Shopkeeper Admin"}</h1>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Counter Dashboard & Live Spooler</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
              }`}
              title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              onClick={() => loadDashboardData()}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <a
              href={`/shop/${shopSlug}`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
            >
              View QR Customer Page
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`max-w-6xl mx-auto px-4 flex space-x-6 text-xs font-semibold border-t overflow-x-auto ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
          <button
            onClick={() => setActiveTab("queue")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "queue"
                ? "border-blue-500 text-blue-500 font-bold"
                : isDark
                ? "border-transparent text-slate-400 hover:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Live Order Queue ({orders.filter((o) => o.status === "pending_payment").length} Pending)
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "pricing"
                ? "border-blue-500 text-blue-500 font-bold"
                : isDark
                ? "border-transparent text-slate-400 hover:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Pricing Editor
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "products"
                ? "border-blue-500 text-blue-500 font-bold"
                : isDark
                ? "border-transparent text-slate-400 hover:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Product Catalog (Add-ons)
          </button>
          <button
            onClick={() => setActiveTab("printers")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "printers"
                ? "border-blue-500 text-blue-500 font-bold"
                : isDark
                ? "border-transparent text-slate-400 hover:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Printer Agent & Retention
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border transition-colors ${isDark ? "bg-slate-900 border-slate-800 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-xs font-semibold block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Today's Revenue</span>
            <span className={`text-2xl font-black mt-1 block ${isDark ? "text-white" : "text-slate-900"}`}>₹{summary.todayRevenue.toFixed(2)}</span>
            <span className="text-xs text-blue-500 font-medium mt-1 block">Paid Orders</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${isDark ? "bg-slate-900 border-slate-800 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-xs font-semibold block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Today's Prints</span>
            <span className={`text-2xl font-black mt-1 block ${isDark ? "text-white" : "text-slate-900"}`}>{summary.todayPrints}</span>
            <span className="text-xs text-blue-500 font-medium mt-1 block">Pages Processed</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${isDark ? "bg-slate-900 border-slate-800 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-xs font-semibold block ${isDark ? "text-slate-400" : "text-slate-500"}`}>This Month's Revenue</span>
            <span className={`text-2xl font-black mt-1 block ${isDark ? "text-white" : "text-slate-900"}`}>₹{summary.monthRevenue.toFixed(2)}</span>
            <span className="text-xs text-purple-400 font-medium mt-1 block">Current Billing Cycle</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${isDark ? "bg-slate-900 border-slate-800 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-xs font-semibold block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Monthly Pages</span>
            <span className={`text-2xl font-black mt-1 block ${isDark ? "text-white" : "text-slate-900"}`}>{summary.monthPrints}</span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Cumulative Total</span>
          </div>
        </div>

        {/* TAB 1: Live Queue */}
        {activeTab === "queue" && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`p-4 border-b flex items-center justify-between flex-wrap gap-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center space-x-2">
                <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>Live Counter Queue</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isDark ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-blue-100 text-blue-800"}`}>
                  {filteredOrders.length} Orders
                </span>
              </div>

              <div className="flex space-x-1.5 text-xs font-semibold">
                <button
                  onClick={() => setQueueFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    queueFilter === "all"
                      ? isDark ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                      : isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setQueueFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    queueFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Waiting Payment
                </button>
                <button
                  onClick={() => setQueueFilter("printing")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    queueFilter === "printing"
                      ? "bg-purple-600 text-white"
                      : isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Printing
                </button>
                <button
                  onClick={() => setQueueFilter("completed")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    queueFilter === "completed"
                      ? "bg-blue-600 text-white"
                      : isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className={`divide-y ${isDark ? "divide-slate-800/80" : "divide-slate-200"}`}>
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No orders in this queue filter. Customers scanning your QR code will appear here instantly.
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const printItem = ord.orderItems?.find((i: any) => i.type === "print");
                  const file = ord.orderFiles?.[0];

                  return (
                    <div
                      key={ord.id}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        isDark ? "hover:bg-slate-850/60" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                          isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Code</span>
                          <span className="font-mono font-black text-sm text-blue-500">{ord.orderCode}</span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                              {file?.originalFilename || "Document"}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${
                                ord.status === "pending_payment"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : ord.status === "paid"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : ord.status === "printing"
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {ord.status.replace("_", " ")}
                            </span>
                          </div>

                          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {printItem ? (
                              <>
                                <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                  {printItem.pageCount * printItem.copies} pages
                                </span>{" "}
                                ({printItem.printMode.toUpperCase()}, {printItem.sided}, {printItem.copies} copies) • Paper: {printItem.paperType}
                              </>
                            ) : null}
                          </p>
                          {ord.customerPhone && (
                            <p className="text-xs text-slate-400 mt-0.5">Phone: {ord.customerPhone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end md:self-center">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Total</span>
                          <span className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                            ₹{ord.totalAmount.toFixed(2)}
                          </span>
                        </div>

                        {ord.status === "pending_payment" ? (
                          <button
                            onClick={() => handleConfirmPayment(ord.id)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Cash &amp; Print</span>
                          </button>
                        ) : ord.status === "printing" ? (
                          <div className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5">
                            <Printer className="w-3.5 h-3.5 animate-bounce" />
                            <span>Spooling to Printer...</span>
                          </div>
                        ) : (
                          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${
                            isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>Done</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Pricing Editor */}
        {activeTab === "pricing" && (
          <div className={`rounded-2xl border shadow-sm p-5 space-y-4 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div>
              <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>Price Configuration</h2>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Edit per-page pricing. New prices apply immediately to customer orders.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`font-bold border-b ${isDark ? "bg-slate-950/60 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  <tr>
                    <th className="py-2.5 px-3">Color Mode</th>
                    <th className="py-2.5 px-3">Sides</th>
                    <th className="py-2.5 px-3">Paper Type</th>
                    <th className="py-2.5 px-3">Price Per Page (₹)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                  {priceRules.map((rule) => (
                    <tr key={rule.id} className={isDark ? "hover:bg-slate-850/50" : "hover:bg-slate-50"}>
                      <td className="py-3 px-3 font-semibold uppercase">{rule.printMode}</td>
                      <td className="py-3 px-3 capitalize">{rule.sided}</td>
                      <td className="py-3 px-3">{rule.paperType}</td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.25"
                          defaultValue={rule.pricePerPage}
                          id={`price_input_${rule.id}`}
                          className={`w-24 px-2.5 py-1.5 border rounded-lg font-bold ${
                            isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                          }`}
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          disabled={savingRuleId === rule.id}
                          onClick={() => {
                            const input = document.getElementById(`price_input_${rule.id}`) as HTMLInputElement;
                            if (input) handleSavePriceRule(rule.id, parseFloat(input.value));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center space-x-1 shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingRuleId === rule.id ? "Saving..." : "Save"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Product Catalog */}
        {activeTab === "products" && (
          <div className={`rounded-2xl border shadow-sm p-5 space-y-6 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div>
              <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>Stationery &amp; Binding Catalog</h2>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Items displayed as add-on checkboxes during customer checkout.</p>
            </div>

            {/* Add product form */}
            <form onSubmit={handleAddProduct} className={`flex gap-3 items-end p-4 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex-1">
                <label className={`text-xs font-semibold block mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spiral Binding / Blue Pen"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-medium ${
                    isDark ? "bg-slate-850 border-slate-750 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="w-32">
                <label className={`text-xs font-semibold block mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>Price (₹)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="30"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-medium ${
                    isDark ? "bg-slate-850 border-slate-750 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </form>

            {/* Product list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((p) => (
                <div key={p.id} className={`p-3.5 rounded-xl border flex items-center justify-between ${isDark ? "bg-slate-850/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div>
                    <h4 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{p.name}</h4>
                    {p.variant && <p className="text-xs text-slate-500">{p.variant}</p>}
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`font-extrabold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>₹{p.price.toFixed(2)}</span>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Printers & Local Agent */}
        {activeTab === "printers" && (
          <div className={`rounded-2xl border shadow-sm p-5 space-y-6 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div>
              <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>Windows Local Printer Agent</h2>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Hardware printers detected on the shop counter PC.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shop.printers?.map((p: any) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex items-start space-x-3 transition-colors ${
                    isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
                  }`}>
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{p.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Connection: <span className="font-semibold capitalize">{p.connectionType}</span> • Type:{" "}
                      <span className="font-semibold uppercase">{p.printerType}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Retention Setting */}
            <div className={`border-t pt-5 space-y-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <h3 className={`font-bold text-sm flex items-center space-x-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Document Auto-Purge Policy</span>
              </h3>
              <p className="text-xs text-slate-400">
                Customer files are automatically purged from disk and cloud after {shop.retentionHours || 25} hours to ensure privacy compliance.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
