"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiShoppingBag,
  FiAlertTriangle,
  FiArrowUpRight,
  FiPackage,
  FiEdit2,
  FiPlus,
  FiCheckCircle,
  FiRefreshCw,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiSave,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../../lib/api";

const LOW_STOCK_THRESHOLD = 5;
const ITEMS_PER_PAGE = 5;

export default function DashboardClient() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Shipping & COD configuration state
  const [shippingSettings, setShippingSettings] = useState({
    standardShippingFee: 49,
    freeShippingThreshold: 499,
    codConvenienceFee: 29,
  });
  const [settingsErrors, setSettingsErrors] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadSummary = useCallback(
    async (targetPage = page, isPaginationOnly = false) => {
      if (isPaginationOnly) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const res = await api.get(
          `/dashboard/summary?page=${targetPage}&limit=${ITEMS_PER_PAGE}`,
        );
        setSummary(res.data);
      } catch (err) {
        setError("Failed to fetch dashboard overview.");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    loadSummary(1, false);

    api
      .get("/settings/shipping")
      .then((res) => {
        if (res.data) setShippingSettings(res.data);
      })
      .catch(() => {});
  }, [loadSummary]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadSummary(newPage, true);
  };

  const validateShippingSettings = () => {
    const errs = {};
    const { freeShippingThreshold, standardShippingFee, codConvenienceFee } =
      shippingSettings;

    if (
      freeShippingThreshold === "" ||
      isNaN(Number(freeShippingThreshold)) ||
      Number(freeShippingThreshold) < 0
    ) {
      errs.freeShippingThreshold = "Must be 0 or greater.";
    }

    if (
      standardShippingFee === "" ||
      isNaN(Number(standardShippingFee)) ||
      Number(standardShippingFee) < 0
    ) {
      errs.standardShippingFee = "Must be 0 or greater.";
    }

    if (
      codConvenienceFee === "" ||
      isNaN(Number(codConvenienceFee)) ||
      Number(codConvenienceFee) < 0
    ) {
      errs.codConvenienceFee = "Must be 0 or greater.";
    }

    setSettingsErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!validateShippingSettings()) return;

    setSavingSettings(true);
    try {
      await api.put("/settings/shipping", {
        standardShippingFee: Number(shippingSettings.standardShippingFee),
        freeShippingThreshold: Number(shippingSettings.freeShippingThreshold),
        codConvenienceFee: Number(shippingSettings.codConvenienceFee),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      alert("Failed to save delivery settings");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="h-8 w-48 bg-brand/10 rounded-lg" />
          <div className="h-9 w-28 bg-brand/10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-white/70 border border-gold/15 rounded-2xl"
            />
          ))}
        </div>
        <div className="h-64 bg-white/70 border border-gold/15 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 sm:my-16 p-6 sm:p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs">
        <FiAlertTriangle className="mx-auto text-rose-500 mb-3" size={32} />
        <h2 className="font-serif text-lg text-brand mb-1">
          Failed to Load Dashboard
        </h2>
        <p className="text-xs text-brand/60 mb-5">{error}</p>
        <button
          onClick={() => {
            setPage(1);
            loadSummary(1, false);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-ivory text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-brand/90 transition-colors"
        >
          <FiRefreshCw size={13} /> Try Again
        </button>
      </div>
    );
  }

  const lowStockList = summary?.lowStockProducts || [];
  const pagination = summary?.pagination || {
    total: lowStockList.length,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  };

  const cards = [
    {
      label: "Revenue (This Month)",
      value: `₹${Number(summary?.monthlyRevenue || 0).toLocaleString("en-IN")}`,
      caption: "Settled gross volume",
      icon: FiPackage,
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
    {
      label: "Orders (This Month)",
      value: summary?.monthlyOrderCount || 0,
      caption: "Total volume placed",
      icon: FiShoppingBag,
      iconBg: "bg-blue-50 text-blue-700 border-blue-200/60",
    },
    {
      label: "Low Stock Products",
      value: pagination.total,
      caption:
        pagination.total === 0 ? "Inventory healthy" : "Requires replenishment",
      icon: FiAlertTriangle,
      iconBg:
        pagination.total > 0
          ? "bg-amber-50 text-amber-700 border-amber-200/60"
          : "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            Store Performance
          </h1>
          <p className="text-xs text-brand/60 mt-1 max-w-xl">
            Real-time monthly retail financials, order metrics, and critical
            inventory alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/products/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-brand/90 hover:shadow-md transition-all"
          >
            <FiPlus size={14} /> Add Product
          </Link>
          <button
            onClick={() => loadSummary(page, false)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-white border border-gold/30 rounded-xl text-xs font-semibold uppercase tracking-wider text-brand hover:bg-gold/10 transition-colors shadow-2xs shrink-0"
            title="Refresh dashboard metrics"
          >
            <FiRefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {cards.map(({ label, value, caption, icon: Icon, iconBg }) => (
          <div
            key={label}
            className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start justify-between gap-4 hover:border-gold/60 transition-colors"
          >
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand/50 block truncate">
                {label}
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-medium text-brand tracking-tight truncate">
                {value}
              </p>
              <span className="text-[11px] text-brand/40 block pt-0.5 truncate">
                {caption}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border shrink-0 ${iconBg}`}>
              <Icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Delivery & COD Fee Configuration Box */}
      <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="border-b border-gold/15 pb-3 mb-5">
          <h2 className="font-serif text-base sm:text-lg text-brand font-medium flex items-center gap-2">
            <FiTruck className="text-clay" /> Shipping & COD Configuration
          </h2>
          <p className="text-xs text-brand/60 mt-1 max-w-2xl">
            Set your store&apos;s standard delivery fee, free delivery cart
            threshold, and COD handling surcharge. Changes reflect instantly on
            customer checkouts.
          </p>
        </div>

        <form
          onSubmit={handleSaveSettings}
          noValidate
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand block">
              Free Shipping Threshold (₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={shippingSettings.freeShippingThreshold}
              onChange={(e) => {
                setShippingSettings({
                  ...shippingSettings,
                  freeShippingThreshold: e.target.value,
                });
                if (settingsErrors.freeShippingThreshold) {
                  setSettingsErrors((prev) => ({
                    ...prev,
                    freeShippingThreshold: null,
                  }));
                }
              }}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs bg-ivory/40 outline-none font-mono transition-all ${
                settingsErrors.freeShippingThreshold
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-gold/30 focus:border-brand"
              }`}
            />
            {settingsErrors.freeShippingThreshold ? (
              <p className="text-[10px] text-rose-600 font-medium">
                {settingsErrors.freeShippingThreshold}
              </p>
            ) : (
              <span className="text-[10px] text-brand/45 block">
                Orders at or above this amount unlock 100% Free Shipping.
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand block">
              Standard Delivery Fee (₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={shippingSettings.standardShippingFee}
              onChange={(e) => {
                setShippingSettings({
                  ...shippingSettings,
                  standardShippingFee: e.target.value,
                });
                if (settingsErrors.standardShippingFee) {
                  setSettingsErrors((prev) => ({
                    ...prev,
                    standardShippingFee: null,
                  }));
                }
              }}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs bg-ivory/40 outline-none font-mono transition-all ${
                settingsErrors.standardShippingFee
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-gold/30 focus:border-brand"
              }`}
            />
            {settingsErrors.standardShippingFee ? (
              <p className="text-[10px] text-rose-600 font-medium">
                {settingsErrors.standardShippingFee}
              </p>
            ) : (
              <span className="text-[10px] text-brand/45 block">
                Charged when the cart value is below the free threshold.
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand block">
              COD Handling Fee (₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={shippingSettings.codConvenienceFee}
              onChange={(e) => {
                setShippingSettings({
                  ...shippingSettings,
                  codConvenienceFee: e.target.value,
                });
                if (settingsErrors.codConvenienceFee) {
                  setSettingsErrors((prev) => ({
                    ...prev,
                    codConvenienceFee: null,
                  }));
                }
              }}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs bg-ivory/40 outline-none font-mono transition-all ${
                settingsErrors.codConvenienceFee
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                  : "border-gold/30 focus:border-brand"
              }`}
            />
            {settingsErrors.codConvenienceFee ? (
              <p className="text-[10px] text-rose-600 font-medium">
                {settingsErrors.codConvenienceFee}
              </p>
            ) : (
              <span className="text-[10px] text-brand/45 block">
                Additional charge added for Cash on Delivery orders.
              </span>
            )}
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand text-ivory text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all disabled:opacity-50"
            >
              {settingsSaved ? (
                <>
                  <FiCheck className="text-emerald-400" size={14} />
                  <span>Saved Successfully</span>
                </>
              ) : (
                <>
                  <FiSave size={14} />
                  <span>
                    {savingSettings ? "Updating..." : "Save Delivery Rates"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link
          href="/orders"
          className="bg-ivory/40 border border-gold/25 rounded-xl p-4 flex items-center justify-between hover:bg-gold/10 hover:border-gold/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-gold/20 text-clay">
              <FiShoppingBag size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">
                Fulfillment Queue
              </p>
              <p className="text-[11px] text-brand/50">
                Manage customer orders
              </p>
            </div>
          </div>
          <FiArrowUpRight
            size={16}
            className="text-brand/40 group-hover:text-brand group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/products"
          className="bg-ivory/40 border border-gold/25 rounded-xl p-4 flex items-center justify-between hover:bg-gold/10 hover:border-gold/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-gold/20 text-clay">
              <FiPackage size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">
                Catalog Inventory
              </p>
              <p className="text-[11px] text-brand/50">
                Edit items, pricing & stock
              </p>
            </div>
          </div>
          <FiArrowUpRight
            size={16}
            className="text-brand/40 group-hover:text-brand group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/banners"
          className="bg-ivory/40 border border-gold/25 rounded-xl p-4 flex items-center justify-between hover:bg-gold/10 hover:border-gold/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-gold/20 text-clay">
              <FiLayers size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">
                Hero Banners
              </p>
              <p className="text-[11px] text-brand/50">
                Update homepage sliders
              </p>
            </div>
          </div>
          <FiArrowUpRight
            size={16}
            className="text-brand/40 group-hover:text-brand group-hover:translate-x-0.5 transition-all"
          />
        </Link>
      </div>

      {/* Low Stock Attention Section */}
      <div className="bg-white border border-gold/25 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-ivory/60 border-b border-gold/15 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-amber-600 shrink-0" size={16} />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand">
              Critical Inventory Alerts ({pagination.total})
            </h2>
          </div>
          <Link
            href="/products"
            className="text-[11px] uppercase tracking-wider font-semibold text-clay hover:underline"
          >
            View All Catalog &rarr;
          </Link>
        </div>

        {lowStockList.length === 0 ? (
          <div className="py-12 sm:py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <FiCheckCircle size={22} />
            </div>
            <p className="font-serif text-base text-brand font-medium">
              All Stocks Sufficient
            </p>
            <p className="text-xs text-brand/50 mt-0.5 max-w-sm mx-auto">
              No products or variants have breached the minimum reorder
              threshold.
            </p>
          </div>
        ) : (
          <div className="relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Mobile View: Clean Card List (< md) */}
            <div className="divide-y divide-gold/10 md:hidden">
              {lowStockList.map((p) => {
                const hasVariants =
                  Array.isArray(p.variants) && p.variants.length > 0;

                const totalStock = hasVariants
                  ? p.variants.reduce(
                      (sum, v) => sum + (Number(v.stock) || 0),
                      0,
                    )
                  : Number(p.stock ?? 0);

                const depletedVariants = hasVariants
                  ? p.variants.filter((v) => (Number(v.stock) || 0) === 0)
                  : [];

                const lowVariants = hasVariants
                  ? p.variants.filter(
                      (v) =>
                        (Number(v.stock) || 0) > 0 &&
                        (Number(v.stock) || 0) <= LOW_STOCK_THRESHOLD,
                    )
                  : [];

                const isFullyDepleted = totalStock === 0;

                return (
                  <div key={p._id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-ivory border border-gold/20 overflow-hidden flex items-center justify-center shrink-0 text-brand/30">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiPackage size={18} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brand text-sm truncate">
                          {p.name}
                        </p>
                        <span className="text-[10px] font-mono text-brand/40 block">
                          {hasVariants
                            ? `Variants: ${p.variants.length}`
                            : "Standard inventory"}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                          isFullyDepleted
                            ? "bg-rose-50 text-rose-700 border-rose-200/60"
                            : "bg-amber-50 text-amber-800 border-amber-200/60"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isFullyDepleted ? "bg-rose-500" : "bg-amber-500"
                          }`}
                        />
                        {isFullyDepleted ? "Out of Stock" : "Low Reserve"}
                      </span>
                    </div>

                    <div className="text-xs bg-ivory/30 p-2.5 rounded-xl border border-gold/15 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-brand/60">
                          Total Units:
                        </span>
                        <span
                          className={`font-semibold font-mono ${
                            isFullyDepleted ? "text-rose-600" : "text-amber-700"
                          }`}
                        >
                          {totalStock} {totalStock === 1 ? "unit" : "units"}
                        </span>
                      </div>

                      {hasVariants && (
                        <div className="pt-1 border-t border-gold/10 space-y-0.5">
                          {depletedVariants.map((v) => (
                            <span
                              key={v.sku}
                              className="text-[10px] text-rose-600 block truncate"
                            >
                              • {v.label}: 0 units (Sold Out)
                            </span>
                          ))}
                          {lowVariants.map((v) => (
                            <span
                              key={v.sku}
                              className="text-[10px] text-amber-700 block truncate"
                            >
                              • {v.label}: {v.stock} units left
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <Link
                        href={`/products/${p._id}/edit`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-ivory border border-gold/30 rounded-lg text-xs font-semibold text-brand hover:bg-gold/15 transition-colors"
                      >
                        <FiEdit2 size={13} />
                        <span>Restock Product</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gold/15 bg-ivory/30 text-brand/60 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3 px-6">Product</th>
                    <th className="py-3 px-4">Remaining Inventory</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {lowStockList.map((p) => {
                    const hasVariants =
                      Array.isArray(p.variants) && p.variants.length > 0;

                    const totalStock = hasVariants
                      ? p.variants.reduce(
                          (sum, v) => sum + (Number(v.stock) || 0),
                          0,
                        )
                      : Number(p.stock ?? 0);

                    const depletedVariants = hasVariants
                      ? p.variants.filter((v) => (Number(v.stock) || 0) === 0)
                      : [];

                    const lowVariants = hasVariants
                      ? p.variants.filter(
                          (v) =>
                            (Number(v.stock) || 0) > 0 &&
                            (Number(v.stock) || 0) <= LOW_STOCK_THRESHOLD,
                        )
                      : [];

                    const isFullyDepleted = totalStock === 0;

                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-ivory/25 transition-colors group"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-ivory border border-gold/20 overflow-hidden flex items-center justify-center shrink-0 text-brand/30">
                              {p.images?.[0] ? (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FiPackage size={16} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-brand text-sm group-hover:text-clay transition-colors">
                                {p.name}
                              </p>
                              <span className="text-[10px] font-mono text-brand/40 block">
                                {hasVariants
                                  ? `Variant tracking (${p.variants.length} options)`
                                  : "Standard inventory"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span
                            className={`font-semibold ${
                              isFullyDepleted
                                ? "text-rose-600"
                                : "text-amber-700"
                            }`}
                          >
                            {totalStock} {totalStock === 1 ? "unit" : "units"}{" "}
                            available
                          </span>

                          {hasVariants ? (
                            <div className="mt-1 space-y-0.5">
                              {depletedVariants.map((v) => (
                                <span
                                  key={v.sku}
                                  className="text-[10px] text-rose-600 block truncate max-w-[240px]"
                                >
                                  • {v.label}: <strong>0 units</strong> (Sold
                                  Out)
                                </span>
                              ))}
                              {lowVariants.map((v) => (
                                <span
                                  key={v.sku}
                                  className="text-[10px] text-amber-700 block truncate max-w-[240px]"
                                >
                                  • {v.label}:{" "}
                                  <strong>{v.stock} units left</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-brand/40 block">
                              Direct base stock
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              isFullyDepleted
                                ? "bg-rose-50 text-rose-700 border-rose-200/60"
                                : "bg-amber-50 text-amber-800 border-amber-200/60"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFullyDepleted ? "bg-rose-500" : "bg-amber-500"
                              }`}
                            />
                            {isFullyDepleted ? "Out of Stock" : "Low Reserve"}
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href={`/products/${p._id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory border border-gold/30 rounded-lg text-xs font-semibold text-brand hover:bg-gold/15 transition-colors"
                          >
                            <FiEdit2 size={13} />
                            <span>Restock</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-4 sm:px-6 py-3.5 bg-ivory/40 border-t border-gold/15 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <span className="text-[11px] text-brand/60 order-2 sm:order-1">
                  Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                  <strong>
                    {Math.min(page * ITEMS_PER_PAGE, pagination.total)}
                  </strong>{" "}
                  of <strong>{pagination.total}</strong> products
                </span>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || tableLoading}
                    className="p-1.5 rounded-lg border border-gold/30 bg-white text-brand/70 hover:bg-gold/10 hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-brand/80 px-2 font-mono">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages || tableLoading}
                    className="p-1.5 rounded-lg border border-gold/30 bg-white text-brand/70 hover:bg-gold/10 hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
