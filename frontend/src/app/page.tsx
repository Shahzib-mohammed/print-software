"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, QrCode, ShieldCheck, Zap, ArrowRight, Store, Settings } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function HomePage() {
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServerStatus("online");
        else setServerStatus("offline");
      })
      .catch(() => setServerStatus("offline"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900">PrintQueue</h1>
              <p className="text-xs text-slate-500">Self-Service Print-Shop Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-full border bg-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverStatus === "online" ? "bg-emerald-500 animate-pulse" : serverStatus === "checking" ? "bg-amber-500" : "bg-rose-500"
                }`}
              />
              <span className="text-slate-600">
                Backend: {serverStatus === "online" ? "Online (Port 5000)" : serverStatus === "checking" ? "Checking..." : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Zero-Friction Print-Shop Automation</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Transform Your Local Print Shop Into A Self-Service Machine
        </h2>
        <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl">
          No WhatsApp file transfers. No waiting in line. Customers scan a counter QR code, upload documents, pay instantly, and jobs auto-print to your Windows PC.
        </p>

        {/* Surface Quick-Access Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
          {/* Surface 1: Customer Flow */}
          <Link
            href="/shop/fastprint"
            className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Customer Ordering Flow
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Simulates scanning the shop's QR code. Drag & drop files, live page count & pricing, and instant UPI/counter checkout.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Open FastPrint Demo</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>

          {/* Surface 2: Shopkeeper Admin */}
          <Link
            href="/admin"
            className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Shopkeeper Dashboard
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Real-time queue of incoming orders, one-click counter cash confirmation, live pricing editor, and add-on catalog.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Open Shop Admin</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>

          {/* Surface 3: Platform Admin */}
          <Link
            href="/platform-admin"
            className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Platform Admin
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Onboard new print shops, generate printable counter QR stands, and monitor network-wide print volume.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>Open Platform Admin</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-2">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <span className="font-semibold text-sm text-slate-800">&lt; 90s Turnaround</span>
            <span className="text-xs text-slate-500">Scan to print in under a minute</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="font-semibold text-sm text-slate-800">25-Hour Auto-Purge</span>
            <span className="text-xs text-slate-500">Customer files strictly deleted</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-2">
              <Printer className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-semibold text-sm text-slate-800">Windows Local Agent</span>
            <span className="text-xs text-slate-500">Wireless & USB printer spooling</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-2">
              <Store className="w-5 h-5 text-purple-500" />
            </div>
            <span className="font-semibold text-sm text-slate-800">Direct Shop Payout</span>
            <span className="text-xs text-slate-500">Cashfree settlement to bank</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-white text-center text-xs text-slate-500">
        <p>PrintQueue © 2026 — Multi-Tenant Self-Service Print-Shop SaaS</p>
      </footer>
    </div>
  );
}
