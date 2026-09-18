"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiPackage,
  FiClock,
  FiDollarSign,
  FiTruck,
  FiChevronRight,
  FiChevronLeft,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../../lib/api";

const statusConfig = {
  placed: {
    label: "Placed",
    badge: "bg-amber-50 text-amber-800 border-amber-200/70",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-blue-50 text-blue-800 border-blue-200/70",
    dot: "bg-blue-500",
  },
  shipped: {
    label: "Shipped",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
    dot: "bg-indigo-500",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-rose-50 text-rose-800 border-rose-200/70",
    dot: "bg-rose-500",
  },
};

const paymentStatusConfig = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  pending: "bg-amber-50 text-amber-800 border-amber-200/60",
  failed: "bg-rose-50 text-rose-700 border-rose-200/60",
};

const FILTER_TABS = [
  { key: "all", label: "All Orders" },
  { key: "placed", label: "New Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const ITEMS_PER_PAGE = 10;

export default function OrdersClient() {
  const [orders, setOrders] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [statusCounts, setStatusCounts] = useState({});
  const [metrics, setMetrics] = useState({
    revenue: 0,
    totalOrders: 0,
    pendingAction: 0,
    codPending: 0,
    delivered: 0,
  });

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Debounce search input typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(
    async (
      targetPage = page,
      currentStatus = statusFilter,
      currentSearch = activeSearch,
      isPaginationOnly = false,
    ) => {
      if (isPaginationOnly) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const queryParams = new URLSearchParams({
          page: String(targetPage),
          limit: String(ITEMS_PER_PAGE),
          status: currentStatus,
        });

        if (currentSearch) queryParams.set("search", currentSearch);

        const res = await api.get(`/orders?${queryParams.toString()}`);

        if (Array.isArray(res.data)) {
          setOrders(res.data);
          setPagination({
            total: res.data.length,
            page: targetPage,
            limit: ITEMS_PER_PAGE,
            totalPages: Math.ceil(res.data.length / ITEMS_PER_PAGE) || 1,
          });
        } else {
          setOrders(res.data.orders || []);
          setPagination(
            res.data.pagination || {
              total: 0,
              page: targetPage,
              limit: ITEMS_PER_PAGE,
              totalPages: 1,
            },
          );
          if (res.data.statusCounts) setStatusCounts(res.data.statusCounts);
          if (res.data.metrics) setMetrics(res.data.metrics);
        }
      } catch (err) {
        setError("Failed to retrieve orders list. Please try again.");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [page, statusFilter, activeSearch],
  );

  useEffect(() => {
    loadOrders(page, statusFilter, activeSearch, orders !== null);
  }, [page, statusFilter, activeSearch, loadOrders]);

  const handleTabChange = (key) => {
    if (key === statusFilter) return;
    setStatusFilter(key);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === page)
      return;
    setPage(newPage);
  };

  // Loading Skeleton State
  if (loading && !orders) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="h-8 w-48 bg-brand/10 rounded-lg" />
          <div className="h-9 w-28 bg-brand/10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/70 border border-gold/15 rounded-2xl"
            />
          ))}
        </div>
        <div className="bg-white/70 border border-gold/15 rounded-2xl h-80" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 sm:my-16 p-6 sm:p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs">
        <FiAlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
        <h2 className="font-serif text-lg text-brand mb-1">
          Failed to Load Orders
        </h2>
        <p className="text-xs text-brand/60 mb-5">{error}</p>
        <button
          onClick={() => loadOrders(1, statusFilter, activeSearch, false)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-ivory text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-brand/90 transition-colors"
        >
          <FiRefreshCw size={13} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            Order Management
          </h1>
          <p className="text-xs text-brand/60 mt-1 max-w-xl">
            Review customer invoices, monitor payment statuses, and organize
            dispatch workflows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(page, statusFilter, activeSearch, false)}
          className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-white border border-gold/30 rounded-xl text-xs font-semibold uppercase tracking-wider text-brand hover:bg-gold/10 transition-colors shadow-2xs"
        >
          <FiRefreshCw size={13} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gold/25 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand/50 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Gross Volume
            </span>
            <FiDollarSign size={16} className="text-clay" />
          </div>
          <p className="font-serif text-2xl font-medium text-brand">
            ₹{Number(metrics.revenue || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-brand/50 mt-1 block">
            Across {metrics.totalOrders || 0} total placements
          </span>
        </div>

        <div className="bg-white border border-gold/25 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand/50 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Awaiting Dispatch
            </span>
            <FiClock size={16} className="text-amber-600" />
          </div>
          <p className="font-serif text-2xl font-medium text-brand">
            {metrics.pendingAction || 0}
          </p>
          <span className="text-[10px] text-amber-700 mt-1 block font-medium">
            Requires confirmation / packing
          </span>
        </div>

        <div className="bg-white border border-gold/25 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand/50 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              COD to Collect
            </span>
            <FiTruck size={16} className="text-clay" />
          </div>
          <p className="font-serif text-2xl font-medium text-brand">
            {metrics.codPending || 0}
          </p>
          <span className="text-[10px] text-brand/50 mt-1 block">
            Payment pending at doorstep
          </span>
        </div>

        <div className="bg-white border border-gold/25 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand/50 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Completed
            </span>
            <FiCheckCircle size={16} className="text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-medium text-brand">
            {metrics.delivered || 0}
          </p>
          <span className="text-[10px] text-emerald-700 mt-1 block font-medium">
            Successfully delivered
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Status Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-gold/20 -mx-4 px-4 sm:mx-0 sm:px-0">
          {FILTER_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            const count = statusCounts[tab.key] ?? 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 sm:px-3.5 py-2 rounded-t-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                  isActive
                    ? "border-brand text-brand bg-white/80"
                    : "border-transparent text-brand/50 hover:text-brand hover:border-gold/40"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-brand text-ivory"
                      : "bg-gold/15 text-brand/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand/40"
            size={15}
          />
          <input
            type="text"
            placeholder="Search order #, customer, city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gold/30 rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>
      </div>

      {/* Orders Container */}
      <div className="bg-white border border-gold/25 rounded-2xl shadow-xs overflow-hidden">
        {!orders || orders.length === 0 ? (
          <div className="py-14 sm:py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gold/10 text-brand flex items-center justify-center mx-auto mb-3">
              <FiPackage size={22} className="text-clay" />
            </div>
            <p className="font-serif text-base text-brand font-medium">
              No orders found
            </p>
            <p className="text-xs text-brand/50 mt-1 max-w-xs mx-auto">
              {activeSearch || statusFilter !== "all"
                ? "Try clearing filters or search queries."
                : "New orders will appear here as customers complete checkout."}
            </p>
          </div>
        ) : (
          <div className="relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Mobile View: Structured Cards (< md) */}
            <div className="divide-y divide-gold/10 md:hidden">
              {orders.map((o) => {
                const statusInfo = statusConfig[o.status] || {
                  label: o.status,
                  badge: "bg-gray-100 text-gray-700 border-gray-200",
                  dot: "bg-gray-400",
                };

                const paymentBadge =
                  paymentStatusConfig[o.payment?.status] ||
                  "bg-gray-100 text-gray-700 border-gray-200";

                const customerName =
                  o.shippingAddress?.name || o.guestInfo?.name || "Anonymous";
                const isGuest = !o.user;

                const formattedDate = new Date(o.createdAt).toLocaleDateString(
                  "en-IN",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                );

                return (
                  <div key={o._id} className="p-4 space-y-3 bg-white">
                    {/* Header Row: Order Number & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/orders/${o._id}`}
                          className="font-mono font-semibold text-brand text-xs hover:text-clay transition-colors"
                        >
                          #{o.orderNumber}
                        </Link>
                        <span className="text-[10px] text-brand/45 flex items-center gap-1 mt-0.5">
                          <FiClock size={11} /> {formattedDate}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                        />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Customer Row */}
                    <div className="flex items-center gap-2.5 pt-1">
                      <div className="w-7 h-7 rounded-full bg-ivory border border-gold/30 text-brand flex items-center justify-center text-[10px] uppercase font-serif shrink-0">
                        {customerName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-brand truncate">
                            {customerName}
                          </span>
                          {isGuest && (
                            <span className="text-[9px] bg-gold/15 text-brand/60 px-1 py-0.2 rounded font-mono uppercase">
                              Guest
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-brand/50 truncate block">
                          {o.shippingAddress?.city
                            ? `${o.shippingAddress.city}, ${o.shippingAddress.state}`
                            : o.user?.email || o.guestInfo?.email || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Payment and Amount Box */}
                    <div className="bg-ivory/30 p-2.5 rounded-xl border border-gold/15 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-serif font-semibold text-brand text-sm block">
                          ₹{Number(o.total || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-brand/40">
                          {o.items?.length || 0}{" "}
                          {(o.items?.length || 0) === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider inline-block ${paymentBadge}`}
                        >
                          {o.payment?.status || "pending"}
                        </span>
                        <span className="text-[10px] text-brand/50 mt-0.5 uppercase font-mono tracking-wider block">
                          {o.payment?.method === "cod" ? "COD" : "Prepaid"}
                        </span>
                      </div>
                    </div>

                    {/* Manage Link */}
                    <div className="pt-1">
                      <Link
                        href={`/orders/${o._id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-ivory border border-gold/30 rounded-xl text-xs font-semibold text-brand hover:bg-gold/15 transition-colors"
                      >
                        <span>Manage Order</span>
                        <FiChevronRight size={14} />
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
                  <tr className="border-b border-gold/15 bg-ivory/60 text-brand/70 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Order Details</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Fulfillment</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {orders.map((o) => {
                    const statusInfo = statusConfig[o.status] || {
                      label: o.status,
                      badge: "bg-gray-100 text-gray-700 border-gray-200",
                      dot: "bg-gray-400",
                    };

                    const paymentBadge =
                      paymentStatusConfig[o.payment?.status] ||
                      "bg-gray-100 text-gray-700 border-gray-200";

                    const customerName =
                      o.shippingAddress?.name ||
                      o.guestInfo?.name ||
                      "Anonymous";
                    const isGuest = !o.user;

                    const formattedDate = new Date(
                      o.createdAt,
                    ).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={o._id}
                        className="hover:bg-ivory/30 transition-colors group"
                      >
                        <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                          <Link
                            href={`/orders/${o._id}`}
                            className="font-mono font-semibold text-brand text-xs group-hover:text-clay transition-colors block"
                          >
                            #{o.orderNumber}
                          </Link>
                          <span className="text-[10px] text-brand/45 flex items-center gap-1 mt-0.5">
                            <FiClock size={11} /> {formattedDate}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-ivory border border-gold/30 text-brand flex items-center justify-center text-[10px] uppercase font-serif shrink-0">
                              {customerName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-brand truncate">
                                  {customerName}
                                </span>
                                {isGuest && (
                                  <span className="text-[9px] bg-gold/15 text-brand/60 px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                                    Guest
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-brand/50 truncate block">
                                {o.shippingAddress?.city
                                  ? `${o.shippingAddress.city}, ${o.shippingAddress.state}`
                                  : o.user?.email || o.guestInfo?.email || "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-serif text-sm font-semibold text-brand">
                            ₹{Number(o.total || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-brand/40 block">
                            {o.items?.length || 0}{" "}
                            {(o.items?.length || 0) === 1 ? "item" : "items"}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${paymentBadge}`}
                            >
                              {o.payment?.status || "pending"}
                            </span>
                          </div>
                          <span className="text-[10px] text-brand/50 mt-1 uppercase font-mono tracking-wider block">
                            {o.payment?.method === "cod"
                              ? "Cash on Delivery"
                              : "Prepaid (Razorpay)"}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${statusInfo.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                            />
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                          <Link
                            href={`/orders/${o._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand/70 group-hover:text-clay transition-colors"
                          >
                            <span>Manage</span>
                            <FiChevronRight size={13} />
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
              <div className="px-4 sm:px-6 py-3.5 bg-ivory/40 border-t border-gold/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-brand/60 order-2 sm:order-1">
                  Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                  <strong>
                    {Math.min(page * ITEMS_PER_PAGE, pagination.total)}
                  </strong>{" "}
                  of <strong>{pagination.total}</strong> orders
                </span>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || tableLoading}
                    className="p-2 sm:p-1.5 rounded-lg border border-gold/30 bg-white text-brand/70 hover:bg-gold/10 hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                    className="p-2 sm:p-1.5 rounded-lg border border-gold/30 bg-white text-brand/70 hover:bg-gold/10 hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
