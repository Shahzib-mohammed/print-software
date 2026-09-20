"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, Plus, QrCode, Building2, Printer, ArrowRight, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function PlatformAdminPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New shop modal/form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadShops() {
    try {
      setLoading(true);
      const res = await fetchApi("/api/shops");
      setShops(res.data);
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShops();
  }, []);

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;

    try {
      setCreating(true);
      await fetchApi("/api/shops", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });
      setName("");
      setSlug("");
      loadShops();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm">PrintQueue Platform Admin</h1>
              <p className="text-xs text-slate-400">Multi-Tenant Onboarding & QR Generator</p>
            </div>
          </div>

          <Link href="/" className="text-xs text-slate-400 hover:text-white font-medium">
            ← Back to Portal
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Onboard New Shop Form */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-base text-slate-900 mb-1">Onboard New Print Shop</h2>
          <p className="text-xs text-slate-500 mb-4">Creates tenant isolation, database scope, and customer URL.</p>

          <form onSubmit={handleCreateShop} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Shop Name</label>
              <input
                type="text"
                placeholder="e.g. Sri Balaji Prints & Xerox"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                }}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">URL Slug</label>
              <div className="flex items-center border rounded-lg bg-slate-50 overflow-hidden text-xs">
                <span className="px-2 text-slate-400">/shop/</span>
                <input
                  type="text"
                  placeholder="balaji-prints"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className="flex-1 py-2 pr-3 bg-transparent font-medium outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              {creating ? "Creating..." : "Create Tenant & Generate QR"}
            </button>
          </form>
        </section>

        {/* List of Shops */}
        <section className="space-y-4">
          <h2 className="font-bold text-base text-slate-900">Active Tenants ({shops.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold capitalize">
                      {s.status}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-500 mt-1">/shop/{s.slug}</p>

                  <div className="mt-4 flex items-center space-x-4 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-900">{s._count?.orders || 0}</span> Orders
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{s._count?.printers || 0}</span> Printers
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{s.retentionHours}h</span> Retention
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex items-center justify-between">
                  <a
                    href={`/shop/${s.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center"
                  >
                    <span>Open Customer QR Page</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>

                  {/* QR Stand Link */}
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:3000/shop/${s.slug}`}
                    target="_blank"
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Counter QR Stand</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
