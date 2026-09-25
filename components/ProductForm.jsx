"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiAlertCircle,
  FiLayers,
  FiTag,
  FiDollarSign,
  FiPercent,
  FiPackage,
} from "react-icons/fi";
import ImageUploader from "./ImageUploader";
import api from "../lib/api";

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function ProductForm({ initialProduct }) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct && initialProduct._id);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => {
    if (!initialProduct) {
      return {
        name: "",
        slug: "",
        description: "",
        category: "",
        images: [],
        basePrice: "",
        stock: "",
        variants: [],
        discount: { isActive: false, percent: "" },
        isActive: true,
        isFeatured: false,
        codEligible: true,
      };
    }
    return {
      ...initialProduct,
      category:
        typeof initialProduct.category === "object"
          ? initialProduct.category._id
          : initialProduct.category,
      stock: initialProduct.stock ?? "",
      discount: initialProduct.discount || { isActive: false, percent: "" },
      codEligible: initialProduct.codEligible !== false,
      variants: initialProduct.variants || [],
      images: initialProduct.images || [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.categories || [];
        setCategories(data);
      })
      .catch(() => setError("Failed to fetch product categories."));
  }, []);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      slug: isEdit ? f.slug : slugify(name),
    }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
    if (!isEdit && errors.slug) setErrors((prev) => ({ ...prev, slug: null }));
  };

  const addVariant = () => {
    setForm((f) => ({
      ...f,
      stock: f.variants?.length === 0 ? "" : f.stock,
      variants: [
        ...(f.variants || []),
        {
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          label: "",
          price: f.basePrice || "",
          stock: 10,
        },
      ],
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v,
      ),
    }));
    if (errors[`variant_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`variant_${index}_${field}`]: null }));
    }
  };

  const removeVariant = (index) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  };

  const calculatedDiscountedPrice =
    form.basePrice && form.discount?.isActive && form.discount?.percent
      ? Math.round(
          Number(form.basePrice) * (1 - Number(form.discount.percent) / 100),
        )
      : null;

  const validate = () => {
    const errs = {};

    if (!form.name || form.name.trim().length < 3) {
      errs.name = "Title must be at least 3 characters.";
    }

    if (!form.slug || form.slug.trim().length === 0) {
      errs.slug = "Slug identifier is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      errs.slug =
        "Slug can only contain lowercase letters, numbers, and dashes.";
    }

    if (!form.category) {
      errs.category = "Please select a category.";
    }

    if (!form.images || form.images.length === 0) {
      errs.images = "At least one product image is required.";
    }

    const basePriceNum = Number(form.basePrice);
    if (!form.basePrice || isNaN(basePriceNum) || basePriceNum <= 0) {
      errs.basePrice = "Please enter a valid price greater than 0.";
    }

    // Standalone stock validation
    if (!form.variants || form.variants.length === 0) {
      const stockNum = Number(form.stock);
      if (form.stock === "" || isNaN(stockNum) || stockNum < 0) {
        errs.stock = "Available stock must be 0 or greater.";
      }
    } else {
      // Variants validation
      form.variants.forEach((v, idx) => {
        if (!v.sku || !v.sku.trim()) {
          errs[`variant_${idx}_sku`] = "SKU required.";
        }
        if (!v.label || !v.label.trim()) {
          errs[`variant_${idx}_label`] = "Label required.";
        }
        const vPrice = Number(v.price);
        if (v.price === "" || isNaN(vPrice) || vPrice <= 0) {
          errs[`variant_${idx}_price`] = "Invalid price.";
        }
        const vStock = Number(v.stock);
        if (v.stock === "" || isNaN(vStock) || vStock < 0) {
          errs[`variant_${idx}_stock`] = "Invalid qty.";
        }
      });
    }

    // Discount validation
    if (form.discount?.isActive) {
      const discountVal = Number(form.discount.percent);
      if (
        !form.discount.percent ||
        isNaN(discountVal) ||
        discountVal < 1 ||
        discountVal > 99
      ) {
        errs.discount = "Discount must be between 1% and 99%.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validate()) {
      setError("Please resolve the highlighted validation errors below.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);

    const basePriceNum = Number(form.basePrice);
    const isDiscountActive = Boolean(form.discount?.isActive);
    const discountPercent = Number(form.discount?.percent);

    // Verify discount has valid positive numbers
    const hasValidDiscount =
      isDiscountActive &&
      !isNaN(discountPercent) &&
      discountPercent > 0 &&
      discountPercent <= 99;

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description?.trim() || "",
      category: form.category,
      images: form.images || [],
      basePrice: basePriceNum,
      isActive: Boolean(form.isActive),
      isFeatured: Boolean(form.isFeatured),
      codEligible: form.codEligible !== false,
      variants: (form.variants || []).map((v) => ({
        sku: v.sku.trim(),
        label: v.label.trim(),
        price: Number(v.price),
        stock: Number(v.stock) || 0,
      })),
      discount: {
        isActive: hasValidDiscount,
        percent: hasValidDiscount ? discountPercent : 0,
        originalPrice: hasValidDiscount ? basePriceNum : basePriceNum,
      },
    };

    // Only assign root stock if the product does NOT use variants
    if (!form.variants || form.variants.length === 0) {
      payload.stock = Number(form.stock) || 0;
    }

    try {
      if (isEdit) {
        await api.put(`/products/${initialProduct._id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      router.push("/products");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save product changes.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand/60 hover:text-clay transition-colors mb-2"
          >
            <FiArrowLeft size={14} /> Back to Catalog
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            {isEdit ? `Edit: ${initialProduct.name}` : "Create New Product"}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto">
          <Link
            href="/products"
            className="flex-1 sm:flex-initial text-center px-4 py-2.5 sm:py-2 text-xs font-semibold uppercase tracking-wider text-brand/70 hover:text-brand border border-gold/30 sm:border-transparent rounded-xl hover:bg-gold/10 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-brand/90 hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEdit ? "Update Product" : "Publish Product"}</span>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50/90 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
          <FiAlertCircle size={17} className="text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Columns: Core Product Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            <h2 className="font-serif text-lg text-brand font-medium tracking-tight flex items-center gap-2">
              <FiTag className="text-clay" /> General Information
            </h2>

            {/* Product Name */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-medium mb-1.5">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Velvet Matte Lip Tint"
                value={form.name}
                onChange={handleNameChange}
                className={`w-full px-3.5 py-2.5 bg-ivory/30 border rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none transition-all ${
                  errors.name
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                    : "border-gold/30 focus:border-brand focus:ring-1 focus:ring-brand/30"
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-medium mb-1.5">
                URL Identifier (Slug) <span className="text-rose-500">*</span>
              </label>
              <div
                className={`flex items-center rounded-xl border overflow-hidden transition-all ${
                  errors.slug
                    ? "border-rose-400 bg-rose-50/20 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-200"
                    : "border-gold/30 bg-ivory/20 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30"
                }`}
              >
                <span className="pl-3 sm:pl-3.5 pr-1 text-xs text-brand/40 select-none font-mono">
                  /product/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setForm({ ...form, slug: e.target.value });
                    if (errors.slug)
                      setErrors((prev) => ({ ...prev, slug: null }));
                  }}
                  className="w-full pr-3.5 py-2.5 bg-transparent text-xs sm:text-sm font-mono text-brand focus:outline-none"
                />
              </div>
              {errors.slug && (
                <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                  {errors.slug}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-medium mb-1.5">
                Formulation & Product Description
              </label>
              <textarea
                rows={4}
                placeholder="Detail ingredients, sensory experience, and application method..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-ivory/30 border border-gold/30 rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Media Assets Card */}
          <div
            className={`bg-white border rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 ${
              errors.images ? "border-rose-300" : "border-gold/25"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-brand font-medium tracking-tight">
                Product Imagery <span className="text-rose-500">*</span>
              </h2>
              {errors.images && (
                <span className="text-[11px] text-rose-600 font-medium">
                  {errors.images}
                </span>
              )}
            </div>
            <p className="text-xs text-brand/60 leading-relaxed">
              Upload clear product bottles, packaging, or shade swatches. The
              first image serves as the catalog card thumbnail.
            </p>
            <ImageUploader
              images={form.images}
              onChange={(images) => {
                setForm({ ...form, images });
                if (images.length > 0 && errors.images) {
                  setErrors((prev) => ({ ...prev, images: null }));
                }
              }}
            />
          </div>

          {/* Variants Card */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg text-brand font-medium tracking-tight flex items-center gap-2">
                  <FiLayers className="text-clay" /> Product Variants
                </h2>
                <p className="text-xs text-brand/60 mt-0.5">
                  Shades, sizes, or volumes with customized pricing and
                  inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand border border-gold/30 bg-ivory/50 px-3 py-1.5 rounded-lg hover:bg-gold/15 transition-colors"
              >
                <FiPlus size={14} /> Add Variant
              </button>
            </div>

            {form.variants?.length === 0 ? (
              <div className="border border-dashed border-gold/30 rounded-xl p-6 text-center bg-ivory/20">
                <FiLayers className="mx-auto text-brand/30 mb-2" size={24} />
                <p className="text-xs text-brand/70 font-medium">
                  No variants added
                </p>
                <p className="text-[11px] text-brand/50 mt-0.5">
                  Standard single-SKU product. Stock is managed directly in the
                  inventory panel.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-brand/50 px-1">
                  <span className="col-span-3">SKU *</span>
                  <span className="col-span-4">Label / Shade *</span>
                  <span className="col-span-2">Price (₹) *</span>
                  <span className="col-span-2">Stock *</span>
                  <span className="col-span-1 text-right">Delete</span>
                </div>

                {form.variants?.map((v, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-2 bg-ivory/30 border border-gold/20 p-3 sm:p-2.5 rounded-xl sm:items-center relative"
                  >
                    {/* SKU */}
                    <div className="sm:col-span-3">
                      <label className="block sm:hidden text-[10px] font-semibold uppercase tracking-wider text-brand/60 mb-1">
                        SKU Identifier *
                      </label>
                      <input
                        placeholder="SKU-XXXX"
                        value={v.sku}
                        onChange={(e) =>
                          updateVariant(i, "sku", e.target.value)
                        }
                        className={`w-full font-mono text-xs px-2.5 py-2 sm:py-1.5 bg-white border rounded-lg focus:outline-none ${
                          errors[`variant_${i}_sku`]
                            ? "border-rose-400 bg-rose-50/20"
                            : "border-gold/30 focus:border-brand"
                        }`}
                      />
                    </div>

                    {/* Label */}
                    <div className="sm:col-span-4">
                      <label className="block sm:hidden text-[10px] font-semibold uppercase tracking-wider text-brand/60 mb-1">
                        Label / Shade *
                      </label>
                      <input
                        placeholder="e.g. 04 Rose Nude (50ml)"
                        value={v.label}
                        onChange={(e) =>
                          updateVariant(i, "label", e.target.value)
                        }
                        className={`w-full text-xs px-2.5 py-2 sm:py-1.5 bg-white border rounded-lg focus:outline-none ${
                          errors[`variant_${i}_label`]
                            ? "border-rose-400 bg-rose-50/20"
                            : "border-gold/30 focus:border-brand"
                        }`}
                      />
                    </div>

                    {/* Price and Stock group on mobile */}
                    <div className="grid grid-cols-2 gap-2 sm:contents">
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-[10px] font-semibold uppercase tracking-wider text-brand/60 mb-1">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Price"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(i, "price", e.target.value)
                          }
                          className={`w-full text-xs px-2.5 py-2 sm:py-1.5 bg-white border rounded-lg focus:outline-none font-mono ${
                            errors[`variant_${i}_price`]
                              ? "border-rose-400 bg-rose-50/20"
                              : "border-gold/30 focus:border-brand"
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-[10px] font-semibold uppercase tracking-wider text-brand/60 mb-1">
                          Stock (Qty) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(i, "stock", e.target.value)
                          }
                          className={`w-full text-xs px-2.5 py-2 sm:py-1.5 bg-white border rounded-lg focus:outline-none font-mono ${
                            errors[`variant_${i}_stock`]
                              ? "border-rose-400 bg-rose-50/20"
                              : "border-gold/30 focus:border-brand"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Delete Action */}
                    <div className="sm:col-span-1 flex justify-end pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        aria-label="Remove variant"
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors inline-flex items-center gap-1 text-xs"
                      >
                        <FiTrash2 size={15} />
                        <span className="sm:hidden text-[11px] font-medium text-rose-500">
                          Remove
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Commercials, Categorization & Store Flags */}
        <div className="space-y-6">
          {/* Classification & Category */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-brand/80">
              Categorization
            </h3>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-medium mb-1.5">
                Store Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  if (errors.category)
                    setErrors((prev) => ({ ...prev, category: null }));
                }}
                className={`w-full px-3.5 py-2.5 bg-ivory/30 border rounded-xl text-xs sm:text-sm text-brand focus:outline-none transition-all cursor-pointer ${
                  errors.category
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-gold/30 focus:border-brand"
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-brand/80 flex items-center gap-2">
              <FiDollarSign className="text-clay" /> Pricing & Inventory
            </h3>

            {/* Base Price */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-medium mb-1.5">
                Base Retail Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand/40 text-xs select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={form.basePrice}
                  onChange={(e) => {
                    setForm({ ...form, basePrice: e.target.value });
                    if (errors.basePrice)
                      setErrors((prev) => ({ ...prev, basePrice: null }));
                  }}
                  className={`w-full pl-8 pr-3.5 py-2.5 bg-ivory/30 border rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none transition-all ${
                    errors.basePrice
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-gold/30 focus:border-brand"
                  }`}
                />
              </div>
              {errors.basePrice && (
                <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                  {errors.basePrice}
                </p>
              )}
            </div>

            {/* Standalone Stock Input */}
            {(!form.variants || form.variants.length === 0) && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-brand/70 font-medium mb-1.5">
                  Available Stock (Units){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <FiPackage
                    className="absolute left-3.5 text-brand/40"
                    size={15}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => {
                      setForm({ ...form, stock: e.target.value });
                      if (errors.stock)
                        setErrors((prev) => ({ ...prev, stock: null }));
                    }}
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-ivory/30 border rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none transition-all ${
                      errors.stock
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-gold/30 focus:border-brand"
                    }`}
                  />
                </div>
                {errors.stock && (
                  <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                    {errors.stock}
                  </p>
                )}
              </div>
            )}

            {/* Strike-Through Discount Configuration */}
            <div className="pt-2 border-t border-gold/15 space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-brand font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.discount?.isActive || false}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      discount: {
                        ...form.discount,
                        isActive: e.target.checked,
                      },
                    });
                    if (errors.discount)
                      setErrors((prev) => ({ ...prev, discount: null }));
                  }}
                  className="w-4 h-4 rounded border-gold/40 text-brand focus:ring-0 accent-brand cursor-pointer"
                />
                <span>Enable Promotional Strike Price</span>
              </label>

              {form.discount?.isActive && (
                <div className="pl-6 space-y-2.5">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      placeholder="Discount % (e.g. 15)"
                      value={form.discount.percent}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          discount: {
                            ...form.discount,
                            percent: e.target.value,
                          },
                        });
                        if (errors.discount)
                          setErrors((prev) => ({ ...prev, discount: null }));
                      }}
                      className={`w-full pr-8 pl-3.5 py-2 bg-ivory/30 border rounded-xl text-xs sm:text-sm font-mono text-brand focus:outline-none ${
                        errors.discount
                          ? "border-rose-400 bg-rose-50/20"
                          : "border-gold/30 focus:border-brand"
                      }`}
                    />
                    <FiPercent
                      className="absolute right-3 text-brand/40"
                      size={14}
                    />
                  </div>

                  {errors.discount && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      {errors.discount}
                    </p>
                  )}

                  {calculatedDiscountedPrice !== null && !errors.discount && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Active Customer Price: ₹
                      {calculatedDiscountedPrice.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visibility and Storefront Toggles */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-brand/80">
              Visibility & Policies
            </h3>

            <div className="space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-gold/40 text-brand focus:ring-0 accent-brand cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-medium text-brand">Storefront Published</p>
                  <p className="text-brand/50 text-[11px]">
                    Visible in search catalog and accessible to buyers.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm({ ...form, isFeatured: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-gold/40 text-brand focus:ring-0 accent-brand cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-medium text-brand">Featured Collection</p>
                  <p className="text-brand/50 text-[11px]">
                    Pinned to the homepage curated spotlights.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.codEligible}
                  onChange={(e) =>
                    setForm({ ...form, codEligible: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-gold/40 text-brand focus:ring-0 accent-brand cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-medium text-brand">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-brand/50 text-[11px]">
                    Allow customers to pay upon physical delivery.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
