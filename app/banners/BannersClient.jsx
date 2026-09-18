"use client";

import { useEffect, useState } from "react";
import {
  FiTrash2,
  FiPlus,
  FiImage,
  FiAlertCircle,
  FiRefreshCw,
  FiMove,
  FiMonitor,
  FiSmartphone,
} from "react-icons/fi";
import ImageUploader from "../../components/ImageUploader";
import api from "../../lib/api";

export default function BannersClient() {
  const [banners, setBanners] = useState(null);
  const [desktopImages, setDesktopImages] = useState([]);
  const [mobileImages, setMobileImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setLoading(true);
    api
      .get("/banners")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.banners || [];
        setBanners(data);
      })
      .catch(() =>
        setError("Failed to fetch promotional banners. Please try again."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!desktopImages.length) {
      setError("Please upload a desktop banner image.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await api.post("/banners", {
        imageUrl: desktopImages[0],
        mobileImageUrl: mobileImages[0] || null,
        order: banners?.length || 0,
      });
      setDesktopImages([]);
      setMobileImages([]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish new banner.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this banner from the storefront?",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => (prev ? prev.filter((b) => b._id !== id) : []));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete banner.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !banners) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="h-8 w-44 bg-brand/10 rounded-lg" />
        <div className="h-56 bg-white/70 border border-gold/15 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/70 border border-gold/15 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            Homepage Hero Banners
          </h1>
          <p className="text-xs text-brand/60 mt-1 max-w-lg">
            Manage high-resolution carousel slides featured on your store’s
            primary landing page.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-gold/30 rounded-xl text-xs font-semibold uppercase tracking-wider text-brand hover:bg-gold/10 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/70 flex items-start gap-2.5 text-xs text-rose-800">
          <FiAlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload New Banner Card */}
      <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div>
          <h2 className="font-serif text-lg text-brand font-medium tracking-tight">
            Add New Slide
          </h2>
          <p className="text-xs text-brand/50 mt-0.5">
            Upload tailored graphics for desktop and mobile viewports to prevent
            squished text.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Desktop Banner Upload */}
          <div className="bg-ivory/30 border border-gold/20 rounded-xl p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand uppercase tracking-wider">
              <FiMonitor size={15} className="text-clay shrink-0" />
              <span>Desktop Banner (Landscape) *</span>
            </div>
            <p className="text-[11px] text-brand/50">
              Ratio: <strong>16:9 or 21:9</strong> (min. 1920 × 800 px)
            </p>
            <ImageUploader images={desktopImages} onChange={setDesktopImages} />
          </div>

          {/* Mobile / Tablet Banner Upload */}
          <div className="bg-ivory/30 border border-gold/20 rounded-xl p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand uppercase tracking-wider">
              <FiSmartphone size={15} className="text-clay shrink-0" />
              <span>Mobile / Tab Banner (Portrait)</span>
            </div>
            <p className="text-[11px] text-brand/50">
              Ratio: <strong>4:5 or 1:1</strong> (min. 800 × 1000 px)
            </p>
            <ImageUploader images={mobileImages} onChange={setMobileImages} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={uploading || !desktopImages.length}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest px-6 py-3 sm:py-2.5 rounded-xl hover:bg-brand/90 hover:shadow-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                <span>Publishing Slide...</span>
              </>
            ) : (
              <>
                <FiPlus size={15} />
                <span>Publish Banner</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Published Banners Showcase */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-brand/80">
            Active Slides ({banners?.length || 0})
          </h2>
          <span className="text-[11px] text-brand/40">
            Displayed in top-to-bottom carousel rotation
          </span>
        </div>

        {!banners || banners.length === 0 ? (
          <div className="bg-white border border-dashed border-gold/30 rounded-2xl py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gold/10 text-clay flex items-center justify-center mx-auto mb-3">
              <FiImage size={22} />
            </div>
            <p className="font-serif text-base text-brand">
              No active banners found
            </p>
            <p className="text-xs text-brand/50 mt-1 max-w-sm mx-auto">
              Upload your first promotional campaign slide above to display it
              on the store homepage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners.map((b, index) => (
              <div
                key={b._id}
                className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 hover:border-gold/60 transition-all group"
              >
                {/* Mobile Top Bar / Desktop Sequence */}
                <div className="flex items-center justify-between md:hidden border-b border-gold/15 pb-2.5">
                  <div className="flex items-center gap-1.5 text-brand/50 font-mono text-xs font-medium">
                    <FiMove size={14} className="text-brand/40" />
                    <span>Slide #{index + 1}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(b._id)}
                    disabled={deletingId === b._id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100 transition-colors disabled:opacity-40"
                  >
                    <FiTrash2 size={14} />
                    <span className="text-[11px] uppercase tracking-wider">
                      Delete
                    </span>
                  </button>
                </div>

                {/* Previews Container */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="hidden md:flex items-center gap-2 text-brand/40 font-mono text-xs select-none shrink-0 pl-1">
                    <FiMove size={14} className="text-brand/30" />
                    <span>#{index + 1}</span>
                  </div>

                  {/* Desktop Preview */}
                  <div className="space-y-1 flex-1 sm:flex-initial">
                    <span className="text-[10px] text-brand/50 uppercase tracking-wider font-semibold block">
                      Desktop
                    </span>
                    <div className="relative w-full sm:w-44 md:w-48 aspect-video h-auto rounded-xl overflow-hidden bg-ivory border border-gold/20 shrink-0">
                      <img
                        src={b.imageUrl}
                        alt={`Desktop banner ${index + 1}`}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  </div>

                  {/* Mobile Preview */}
                  <div className="space-y-1 shrink-0">
                    <span className="text-[10px] text-brand/50 uppercase tracking-wider font-semibold block">
                      Mobile
                    </span>
                    <div className="relative w-20 sm:w-24 aspect-square sm:aspect-[4/5] rounded-xl overflow-hidden bg-ivory border border-gold/20 shrink-0 flex items-center justify-center text-brand/40 text-[10px] p-1 text-center font-medium">
                      {b.mobileImageUrl ? (
                        <img
                          src={b.mobileImageUrl}
                          alt={`Mobile banner ${index + 1}`}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <span>Same as Desktop</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions (Hidden on Mobile, Visible on md+) */}
                <div className="hidden md:flex items-center justify-end pr-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(b._id)}
                    disabled={deletingId === b._id}
                    className="inline-flex items-center justify-center p-2.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40"
                    title="Delete banner"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
