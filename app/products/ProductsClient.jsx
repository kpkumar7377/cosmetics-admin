"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPackage,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import api from "../../lib/api";

const ITEMS_PER_PAGE = 10;

export default function ProductsClient() {
  const [products, setProducts] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Debounce search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(
    async (
      targetPage = page,
      query = activeSearch,
      isPaginationOnly = false,
    ) => {
      if (isPaginationOnly) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: String(targetPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (query) queryParams.set("search", query);

        const res = await api.get(
          `/products/admin/all?${queryParams.toString()}`,
        );

        if (Array.isArray(res.data)) {
          setProducts(res.data);
          setPagination({
            total: res.data.length,
            page: targetPage,
            limit: ITEMS_PER_PAGE,
            totalPages: Math.ceil(res.data.length / ITEMS_PER_PAGE) || 1,
          });
        } else {
          setProducts(res.data.products || []);
          setPagination(
            res.data.pagination || {
              total: 0,
              page: targetPage,
              limit: ITEMS_PER_PAGE,
              totalPages: 1,
            },
          );
        }
      } catch {
        setError("Failed to retrieve inventory list. Please refresh.");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [page, activeSearch],
  );

  useEffect(() => {
    load(page, activeSearch, products !== null);
  }, [page, activeSearch, load]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === page)
      return;
    setPage(newPage);
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(`Are you sure you want to permanently delete "${name}"?`)
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      load(page, activeSearch, true);
    } catch {
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Initial Loading Skeleton
  if (loading && !products) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="h-8 w-44 bg-brand/10 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-brand/10 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white border border-gold/20 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 sm:h-14 bg-ivory/60 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs">
        <FiAlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
        <h2 className="font-serif text-lg text-brand mb-1">
          Failed to Load Products
        </h2>
        <p className="text-xs text-brand/60 mb-5">{error}</p>
        <button
          onClick={() => load(1, activeSearch, false)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-ivory text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-brand/90 transition-colors"
        >
          <FiRefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            Inventory & Catalog
          </h1>
          <p className="text-xs text-brand/60 mt-1">
            {pagination.total} total{" "}
            {pagination.total === 1 ? "product" : "products"} listed
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/products/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-brand/90 hover:shadow-md transition-all"
          >
            <FiPlus size={16} /> Add Product
          </Link>
          <button
            onClick={() => load(page, activeSearch, false)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gold/30 rounded-xl text-xs font-semibold uppercase tracking-wider text-brand hover:bg-gold/10 transition-colors shadow-2xs shrink-0"
            title="Refresh list"
          >
            <FiRefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative w-full sm:max-w-md">
        <FiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand/40"
          size={16}
        />
        <input
          type="text"
          placeholder="Filter by product name, variant, or SKU..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gold/30 rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
        />
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gold/25 rounded-2xl shadow-xs overflow-hidden">
        {!products || products.length === 0 ? (
          <div className="py-14 sm:py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gold/10 text-brand flex items-center justify-center mx-auto mb-3">
              <FiPackage size={22} className="text-clay" />
            </div>
            <p className="font-serif text-base text-brand font-medium">
              No products found
            </p>
            <p className="text-xs text-brand/50 mt-1 max-w-xs mx-auto">
              {activeSearch
                ? `No items match "${activeSearch}". Try changing your search terms.`
                : "Create your first product to get started."}
            </p>
          </div>
        ) : (
          <div className="relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <span className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Mobile Cards Layout (< md) */}
            <div className="divide-y divide-gold/10 md:hidden">
              {products.map((p) => {
                const hasVariants = Boolean(
                  p.variants && p.variants.length > 0,
                );
                const totalStock = hasVariants
                  ? p.variants.reduce(
                      (acc, v) => acc + (Number(v.stock) || 0),
                      0,
                    )
                  : Number(p.stock ?? 0);

                const isOutOfStock = totalStock === 0;
                const isLowStock = totalStock > 0 && totalStock <= 5;

                return (
                  <div key={p._id} className="p-4 space-y-3 bg-white">
                    {/* Top Row: Product Info & Thumbnail */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-ivory border border-gold/20 overflow-hidden shrink-0 flex items-center justify-center text-brand/30">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiPackage size={20} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brand text-sm truncate">
                          {p.name}
                        </p>
                        <span className="text-[10px] text-brand/40 font-mono truncate block mt-0.5">
                          ID: {p._id}
                        </span>

                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low ({totalStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In Stock ({totalStock})
                            </span>
                          )}

                          {p.discount?.isActive && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                              {p.discount.percent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Pricing & Stock Section */}
                    <div className="bg-ivory/30 p-2.5 rounded-xl border border-gold/15 text-xs space-y-1.5">
                      {hasVariants ? (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-brand/50 tracking-wider block">
                            Variants & Pricing ({p.variants.length})
                          </span>
                          {p.variants.map((v) => (
                            <div
                              key={v.sku}
                              className="flex items-center justify-between text-[11px] pt-0.5"
                            >
                              <span className="text-brand/80 truncate max-w-[150px]">
                                {v.label}
                              </span>
                              <div className="flex items-center gap-2 font-mono">
                                <span className="font-semibold text-brand">
                                  ₹{Number(v.price).toLocaleString("en-IN")}
                                </span>
                                <span
                                  className={`text-[10px] ${
                                    Number(v.stock) === 0
                                      ? "text-rose-600 font-semibold"
                                      : Number(v.stock) <= 3
                                        ? "text-amber-700"
                                        : "text-brand/60"
                                  }`}
                                >
                                  ({v.stock} left)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-brand/50 tracking-wider block">
                              Base Price
                            </span>
                            <span className="font-serif text-sm font-semibold text-brand">
                              ₹{Number(p.basePrice).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-semibold text-brand/50 tracking-wider block">
                              Inventory
                            </span>
                            <span
                              className={`font-mono text-xs font-semibold ${
                                isOutOfStock
                                  ? "text-rose-600"
                                  : isLowStock
                                    ? "text-amber-700"
                                    : "text-brand/80"
                              }`}
                            >
                              {p.stock ?? 0} units
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/products/${p._id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-ivory border border-gold/30 rounded-xl text-xs font-semibold text-brand hover:bg-gold/15 transition-colors"
                      >
                        <FiEdit2 size={13} />
                        <span>Edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id, p.name)}
                        disabled={deletingId === p._id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 text-rose-600 border border-rose-200/70 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors disabled:opacity-40"
                      >
                        <FiTrash2 size={13} />
                        <span>Delete</span>
                      </button>
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
                    <th className="py-3.5 px-6">Product</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock Breakdown</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {products.map((p) => {
                    const hasVariants = Boolean(
                      p.variants && p.variants.length > 0,
                    );
                    const totalStock = hasVariants
                      ? p.variants.reduce(
                          (acc, v) => acc + (Number(v.stock) || 0),
                          0,
                        )
                      : Number(p.stock ?? 0);

                    const isOutOfStock = totalStock === 0;
                    const isLowStock = totalStock > 0 && totalStock <= 5;

                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-ivory/30 transition-colors group"
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-ivory border border-gold/20 overflow-hidden shrink-0 flex items-center justify-center text-brand/30">
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
                            <div className="min-w-0 max-w-xs lg:max-w-sm">
                              <p className="font-medium text-brand truncate group-hover:text-clay transition-colors text-sm">
                                {p.name}
                              </p>
                              <span className="text-[10px] text-brand/40 font-mono truncate block">
                                ID: {p._id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {hasVariants ? (
                            <div className="space-y-1 max-w-[180px]">
                              {p.variants.map((v) => (
                                <div
                                  key={v.sku}
                                  className="flex items-center justify-between text-[11px] gap-2"
                                >
                                  <span className="text-brand/70 truncate">
                                    {v.label}
                                  </span>
                                  <span className="font-mono font-medium text-brand/80">
                                    ₹{Number(v.price).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="font-serif text-sm font-medium text-brand">
                              ₹{Number(p.basePrice).toLocaleString("en-IN")}
                            </div>
                          )}
                          {p.discount?.isActive && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50 mt-1 inline-block">
                              {p.discount.percent}% OFF
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {hasVariants ? (
                            <div className="space-y-1 max-w-[200px]">
                              {p.variants.map((v) => (
                                <div
                                  key={v.sku}
                                  className="flex items-center justify-between text-[11px] gap-2"
                                >
                                  <span className="text-brand/70 truncate">
                                    {v.label}
                                  </span>
                                  <span
                                    className={`font-mono font-medium ${
                                      Number(v.stock) === 0
                                        ? "text-rose-600"
                                        : Number(v.stock) <= 3
                                          ? "text-amber-700"
                                          : "text-brand/70"
                                    }`}
                                  >
                                    {v.stock}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span
                              className={`font-mono text-xs font-semibold ${
                                isOutOfStock
                                  ? "text-rose-600"
                                  : isLowStock
                                    ? "text-amber-700"
                                    : "text-brand/80"
                              }`}
                            >
                              {p.stock ?? 0} units
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low ({totalStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In Stock ({totalStock})
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/products/${p._id}/edit`}
                              title="Edit Product"
                              className="p-2 text-brand/50 hover:text-clay hover:bg-gold/10 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={15} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(p._id, p.name)}
                              disabled={deletingId === p._id}
                              title="Delete Product"
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
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
                  of <strong>{pagination.total}</strong> products
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
