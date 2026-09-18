"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiFolder,
  FiAlertCircle,
  FiTag,
  FiCornerDownLeft,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../lib/api";

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ITEMS_PER_PAGE = 8;

export default function CategoriesClient() {
  const [categories, setCategories] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [newName, setNewName] = useState("");
  const [newInputError, setNewInputError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState("");

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Debounce search query
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
      setError("");

      try {
        const queryParams = new URLSearchParams({
          page: String(targetPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (query) queryParams.set("search", query);

        const res = await api.get(`/categories?${queryParams.toString()}`);

        if (Array.isArray(res.data)) {
          setCategories(res.data);
          setPagination({
            total: res.data.length,
            page: targetPage,
            limit: ITEMS_PER_PAGE,
            totalPages: Math.ceil(res.data.length / ITEMS_PER_PAGE) || 1,
          });
        } else {
          setCategories(res.data.categories || []);
          setPagination(
            res.data.pagination || {
              total: 0,
              page: targetPage,
              limit: ITEMS_PER_PAGE,
              totalPages: 1,
            },
          );
        }
      } catch (err) {
        setError("Failed to retrieve categories. Please reload.");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [page, activeSearch],
  );

  useEffect(() => {
    load(page, activeSearch, categories !== null);
  }, [page, activeSearch, load]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === page)
      return;
    setPage(newPage);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();

    if (!trimmed) {
      setNewInputError("Category name cannot be empty.");
      return;
    }
    if (trimmed.length < 2) {
      setNewInputError("Category name must be at least 2 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNewInputError("");

    try {
      await api.post("/categories", { name: trimmed, slug: slugify(trimmed) });
      setNewName("");
      load(page, activeSearch, true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditingName(cat.name);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditError("");
  };

  const saveEdit = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditError("Name cannot be blank.");
      return;
    }
    if (trimmed.length < 2) {
      setEditError("Must be at least 2 characters.");
      return;
    }

    try {
      await api.put(`/categories/${id}`, {
        name: trimmed,
        slug: slugify(trimmed),
      });
      setEditingId(null);
      setEditingName("");
      setEditError("");
      load(page, activeSearch, true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update category.");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete category "${name}"? Products in this category may need reassigning.`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/categories/${id}`);
      load(page, activeSearch, true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category.");
    }
  };

  // Skeleton Loader
  if (loading && !categories) {
    return (
      <div className="max-w-xl mx-auto py-6 sm:py-8 px-4 space-y-6 animate-pulse">
        <div className="h-8 w-44 bg-brand/10 rounded-lg" />
        <div className="h-28 bg-white/70 border border-gold/15 rounded-2xl" />
        <div className="bg-white border border-gold/20 rounded-2xl p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-ivory/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            Product Categories
          </h1>
          <p className="text-xs text-brand/60 mt-1">
            {pagination.total} total{" "}
            {pagination.total === 1 ? "category" : "categories"} listed
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(page, activeSearch, false)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gold/30 rounded-xl text-xs font-semibold uppercase tracking-wider text-brand hover:bg-gold/10 transition-colors shadow-2xs shrink-0"
          title="Refresh list"
        >
          <FiRefreshCw size={13} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
          <FiAlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Category Card */}
      <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-5 shadow-xs">
        <form onSubmit={handleCreate} className="space-y-3" noValidate>
          <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-semibold">
            Create Category
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <FiTag
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand/40"
                size={15}
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (newInputError) setNewInputError("");
                }}
                placeholder="e.g. Cleansers & Toners"
                className={`w-full pl-9 pr-3.5 py-2.5 bg-ivory/30 border rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none transition-all ${
                  newInputError
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                    : "border-gold/30 focus:border-brand focus:ring-1 focus:ring-brand/30"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-brand/90 hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiPlus size={15} />
              )}
              <span>Add Category</span>
            </button>
          </div>

          {newInputError && (
            <p className="text-[11px] text-rose-600 font-medium pl-1">
              {newInputError}
            </p>
          )}

          {newName.trim() && (
            <p className="text-[11px] text-brand/50 font-mono pl-1 truncate">
              Slug: /category/{slugify(newName)}
            </p>
          )}
        </form>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <FiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand/40"
          size={15}
        />
        <input
          type="text"
          placeholder="Filter categories by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gold/30 rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
        />
      </div>

      {/* Category List Card */}
      <div className="bg-white border border-gold/25 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3 bg-ivory/60 border-b border-gold/15 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand/70">
            Available Categories ({pagination.total})
          </span>
          <span className="text-[10px] text-brand/40">Inline editable</span>
        </div>

        {!categories || categories.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gold/10 text-clay flex items-center justify-center mx-auto mb-3">
              <FiFolder size={22} />
            </div>
            <p className="font-serif text-sm text-brand font-medium">
              No categories found
            </p>
            <p className="text-xs text-brand/50 mt-0.5 max-w-xs mx-auto">
              {activeSearch
                ? `No categories match "${activeSearch}".`
                : "Add your first department using the form above."}
            </p>
          </div>
        ) : (
          <div>
            <div className="relative">
              {tableLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <span className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <ul className="divide-y divide-gold/10">
                {categories.map((c) => {
                  const isEditing = editingId === c._id;

                  return (
                    <li
                      key={c._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-ivory/25 transition-colors group"
                    >
                      {isEditing ? (
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editingName}
                              onChange={(e) => {
                                setEditingName(e.target.value);
                                if (editError) setEditError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(c._id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className={`flex-1 text-xs sm:text-sm px-3 py-1.5 bg-white border rounded-lg focus:outline-none ${
                                editError
                                  ? "border-rose-400 bg-rose-50/20"
                                  : "border-brand/40 focus:ring-1 focus:ring-brand/30"
                              }`}
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => saveEdit(c._id)}
                                aria-label="Save changes"
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Save (Enter)"
                              >
                                <FiCheck size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                aria-label="Cancel editing"
                                className="p-2 text-brand/50 hover:bg-gold/10 rounded-lg transition-colors"
                                title="Cancel (Esc)"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          </div>
                          {editError ? (
                            <p className="text-[10px] text-rose-600 font-medium">
                              {editError}
                            </p>
                          ) : (
                            <span className="text-[10px] text-brand/40 hidden sm:inline-flex items-center gap-0.5">
                              <FiCornerDownLeft size={10} /> Enter to save, Esc
                              to cancel
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-brand group-hover:text-clay transition-colors block truncate">
                              {c.name}
                            </span>
                            <p className="text-[10px] font-mono text-brand/40 mt-0.5 truncate">
                              /{c.slug}
                            </p>
                          </div>

                          {/* Action Icons */}
                          <div className="flex items-center justify-end gap-1 shrink-0 pt-1 sm:pt-0 border-t border-gold/10 sm:border-0">
                            <button
                              type="button"
                              onClick={() => startEdit(c)}
                              aria-label="Edit category"
                              className="p-2 text-brand/40 hover:text-clay hover:bg-gold/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c._id, c.name)}
                              aria-label="Delete category"
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-4 sm:px-5 py-3 bg-ivory/40 border-t border-gold/15 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <span className="text-[11px] text-brand/60 order-2 sm:order-1">
                  Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                  <strong>
                    {Math.min(page * ITEMS_PER_PAGE, pagination.total)}
                  </strong>{" "}
                  of <strong>{pagination.total}</strong>
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
