"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  FiUsers,
  FiSend,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiEdit3,
  FiAlertCircle,
  FiMail,
  FiCalendar,
} from "react-icons/fi";
import api from "../../lib/api";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid Next.js SSR window document issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "") ||
  "https://cosmeticsstore.in";

const PREFILLED_TEMPLATES = [
  {
    name: "New Botanical Launch",
    subject: "✨ Unveiling Botanical Radiance: The Restorative Serum",
    body: `
      <!-- Hero Header Banner -->
      <div style="text-align: center; padding: 24px 16px 20px; background: linear-gradient(180deg, #FAF7F2 0%, #FFFFFF 100%); border-radius: 12px; margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #B85D43; display: inline-block; margin-bottom: 8px;">
          New Formulation Drop
        </span>
        <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.3; color: #1A1A1A; margin: 0 0 10px; font-weight: 500;">
          Experience Pure Botanical Radiance
        </h1>
        <p style="font-size: 14px; color: #666666; max-width: 440px; margin: 0 auto; line-height: 1.6;">
          Engineered with active cold-pressed botanicals to deeply nourish, revitalize, and restore your skin barrier.
        </p>
      </div>

      <!-- Key Ingredients / Feature Grid -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 28px; background-color: #FAF8F5; border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px;">
        <tr>
          <td style="padding: 16px; border-right: 1px solid rgba(212, 175, 55, 0.2); width: 33.33%; text-align: center; vertical-align: top;">
            <p style="font-size: 18px; margin: 0 0 4px;">🌿</p>
            <p style="font-size: 12px; font-weight: 700; color: #1A1A1A; margin: 0 0 2px;">Organic Rosehip</p>
            <p style="font-size: 11px; color: #777777; margin: 0;">Deep Cellular Repair</p>
          </td>
          <td style="padding: 16px; border-right: 1px solid rgba(212, 175, 55, 0.2); width: 33.33%; text-align: center; vertical-align: top;">
            <p style="font-size: 18px; margin: 0 0 4px;">💧</p>
            <p style="font-size: 12px; font-weight: 700; color: #1A1A1A; margin: 0 0 2px;">Niacinamide 5%</p>
            <p style="font-size: 11px; color: #777777; margin: 0;">Even Tone & Texture</p>
          </td>
          <td style="padding: 16px; width: 33.33%; text-align: center; vertical-align: top;">
            <p style="font-size: 18px; margin: 0 0 4px;">✨</p>
            <p style="font-size: 12px; font-weight: 700; color: #1A1A1A; margin: 0 0 2px;">Plant Peptides</p>
            <p style="font-size: 11px; color: #777777; margin: 0;">Firming Elasticity</p>
          </td>
        </tr>
      </table>

      <!-- Product Description -->
      <div style="font-size: 14px; line-height: 1.7; color: #333333; margin-bottom: 24px;">
        <p style="margin: 0 0 12px;">
          Our new <strong>Botanical Restorative Serum</strong> is handcrafted in small, fresh batches. Designed for delicate Indian skin textures exposed to urban stressors, it absorbs instantly without any greasy residue.
        </p>
        <p style="margin: 0;">
          Suitable for all skin types, 100% cruelty-free, and dermatologically tested.
        </p>
      </div>

      <!-- Action Button (Bulletproof CTA) -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <a href="${STOREFRONT_URL}/products" 
               style="background-color: #1F3A5F; color: #FFFFFF; text-decoration: none; padding: 14px 34px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; box-shadow: 0 4px 14px rgba(31, 58, 95, 0.2);">
              Shop New Serum &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Trust Assurance Strip -->
      <div style="text-align: center; padding: 12px; background-color: #FAF8F5; border-radius: 8px;">
        <p style="font-size: 11px; color: #888888; margin: 0;">
          📦 <strong>Limited Launch Offer:</strong> Complimentary Shipping on orders over ₹499
        </p>
      </div>
    `,
  },
  {
    name: "VIP Weekend Promotion",
    subject: "🏷️ Private Access: 20% Off Your Curated Weekend Glow",
    body: `
      <!-- VIP Invitation Header -->
      <div style="text-align: center; padding: 24px 16px 16px; margin-bottom: 20px;">
        <span style="display: inline-block; background-color: rgba(184, 93, 67, 0.1); color: #B85D43; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
          VIP Exclusive Privilege
        </span>
        <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.3; color: #1A1A1A; margin: 0 0 8px; font-weight: 500;">
          Your Weekend Glow Treat Awaits
        </h1>
        <p style="font-size: 14px; color: #666666; margin: 0;">
          A curated thank you for being a part of our intimate beauty community.
        </p>
      </div>

      <!-- Luxury Voucher Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 28px;">
        <tr>
          <td style="background: linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%); border: 1.5px dashed #D4AF37; border-radius: 14px; padding: 22px 20px; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #888888; margin: 0 0 6px;">
              Apply coupon at checkout
            </p>
            <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; color: #B85D43; letter-spacing: 3px; margin: 4px 0 6px;">
              GLOWVIP20
            </div>
            <p style="font-size: 12px; font-weight: 600; color: #1A1A1A; margin: 0;">
              Flat 20% OFF Entire Skincare & Haircare Catalog
            </p>
          </td>
        </tr>
      </table>

      <!-- Copy Explanation -->
      <div style="font-size: 14px; line-height: 1.7; color: #444444; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 10px;">
          Whether you're restocking your everyday essential hydrating toners or indulging in concentrated night serums, your private discount is now live.
        </p>
        <p style="font-size: 12px; color: #888888; margin: 0;">
          ⏰ Offer strictly valid until Sunday midnight or while stocks last.
        </p>
      </div>

      <!-- Action Button (Bulletproof CTA) -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 26px 0 10px;">
        <tr>
          <td align="center">
            <a href="${STOREFRONT_URL}/products" 
               style="background-color: #B85D43; color: #FFFFFF; text-decoration: none; padding: 14px 34px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; box-shadow: 0 4px 14px rgba(184, 93, 67, 0.25);">
              Claim 20% Off Now &rarr;
            </a>
          </td>
        </tr>
      </table>
    `,
  },
];

export default function NewsletterClient() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaign");

  // Campaign State
  const [subject, setSubject] = useState(PREFILLED_TEMPLATES[0].subject);
  const [content, setContent] = useState(PREFILLED_TEMPLATES[0].body);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/newsletter/subscribers");
      setSubscribers(res.data || []);
    } catch (err) {
      console.error("Failed to load subscribers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm("Remove this email from the subscriber list?")) return;
    try {
      await api.delete(`/newsletter/subscribers/${id}`);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert("Failed to remove subscriber");
    }
  };

  const handleApplyTemplate = (tpl) => {
    setSubject(tpl.subject);
    setContent(tpl.body);
    setFormErrors({});
  };

  const validateCampaign = () => {
    const errors = {};
    if (!subject || subject.trim().length < 3) {
      errors.subject = "Subject line must be at least 3 characters.";
    }

    // Strip out HTML tags to inspect if there is readable content
    const strippedContent = content
      ? content.replace(/<[^>]+>/g, "").trim()
      : "";
    if (!strippedContent) {
      errors.content = "Email body cannot be empty.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenPreview = () => {
    if (!validateCampaign()) return;
    setPreviewOpen(true);
  };

  const handleSendCampaign = async () => {
    if (!validateCampaign()) return;

    if (subscribers.length === 0) {
      alert("There are no subscribers in the audience list to dispatch to.");
      return;
    }

    if (
      !window.confirm(
        `Are you ready to dispatch this promotional email to ${subscribers.length} subscriber(s)?`,
      )
    ) {
      return;
    }

    setSending(true);
    setSendSuccess("");
    try {
      const res = await api.post("/newsletter/send-campaign", {
        subject: subject.trim(),
        htmlContent: content,
      });
      setSendSuccess(
        res.data.message || "Emails queued successfully via BullMQ!",
      );
      setPreviewOpen(false);
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to dispatch email campaign.",
      );
    } finally {
      setSending(false);
    }
  };

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
      ],
    }),
    [],
  );

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
            Newsletter & Promotional Campaigns
          </h1>
          <p className="text-xs text-brand/60 mt-1 max-w-xl">
            Review subscribed members, craft branded luxury marketing emails,
            and dispatch.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 sm:flex bg-ivory border border-gold/30 rounded-xl p-1 shadow-2xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("campaign")}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "campaign"
                ? "bg-brand text-ivory shadow-xs"
                : "text-brand/60 hover:text-brand"
            }`}
          >
            <FiEdit3 size={14} className="shrink-0" />
            <span className="truncate">Compose</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscribers")}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "subscribers"
                ? "bg-brand text-ivory shadow-xs"
                : "text-brand/60 hover:text-brand"
            }`}
          >
            <FiUsers size={14} className="shrink-0" />
            <span className="truncate">Members ({subscribers.length})</span>
          </button>
        </div>
      </div>

      {sendSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <FiCheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{sendSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSendSuccess("")}
            className="text-emerald-600 hover:text-emerald-900 p-1"
            aria-label="Dismiss alert"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: COMPOSE CAMPAIGN */}
      {activeTab === "campaign" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quill Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-brand/70 block mb-1.5">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (formErrors.subject) {
                      setFormErrors((prev) => ({ ...prev, subject: null }));
                    }
                  }}
                  placeholder="e.g. Exclusive Weekend Drop: Free Gift Inside"
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs bg-ivory/30 outline-none transition-all ${
                    formErrors.subject
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-gold/30 focus:border-brand"
                  }`}
                />
                {formErrors.subject && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1.5">
                    {formErrors.subject}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-brand/70 block mb-1.5">
                  Email Body Content <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`border rounded-xl overflow-hidden bg-ivory/20 ${
                    formErrors.content ? "border-rose-400" : "border-gold/30"
                  }`}
                >
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={(val) => {
                      setContent(val);
                      if (formErrors.content) {
                        setFormErrors((prev) => ({ ...prev, content: null }));
                      }
                    }}
                    modules={quillModules}
                    className="bg-white min-h-[240px] sm:min-h-[280px]"
                  />
                </div>
                {formErrors.content && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1.5">
                    {formErrors.content}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gold/15">
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ivory border border-gold/30 text-brand text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gold/10 transition-colors"
                >
                  <FiEye size={14} /> Preview Email
                </button>
                <button
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={sending || subscribers.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-ivory text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                      <span>Queueing Campaign...</span>
                    </>
                  ) : (
                    <>
                      <FiSend size={14} />
                      <span>Send to {subscribers.length} Members</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Templates & Audience Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand/70">
                Prefilled Templates
              </h3>
              <p className="text-[11px] text-brand/50">
                Click any template to quickly prefill high-converting
                promotional copy.
              </p>
              <div className="space-y-2 pt-1">
                {PREFILLED_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full text-left p-3 rounded-xl border border-gold/25 bg-ivory/40 hover:bg-gold/10 hover:border-gold/50 transition-all text-xs"
                  >
                    <p className="font-semibold text-brand">{tpl.name}</p>
                    <p className="text-[10px] text-brand/50 truncate mt-0.5">
                      {tpl.subject}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-5 shadow-xs text-xs space-y-2">
              <h3 className="font-semibold uppercase tracking-wider text-brand/70 text-[11px]">
                Audience Reach
              </h3>
              <p className="text-brand/60">
                Total Subscribed:{" "}
                <strong className="text-brand">
                  {subscribers.length} recipients
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIBERS LIST */}
      {activeTab === "subscribers" && (
        <div className="bg-white border border-gold/25 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-ivory/60 border-b border-gold/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUsers className="text-clay shrink-0" size={16} />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-brand">
                Enrolled Members ({subscribers.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={loadSubscribers}
              className="inline-flex items-center gap-1.5 text-xs text-brand/70 hover:text-brand font-medium px-2 py-1 rounded-lg hover:bg-gold/10 transition-colors"
            >
              <FiRefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-brand/50">
              <span className="inline-block w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-brand/50">
              No newsletter subscribers enrolled yet.
            </div>
          ) : (
            <div>
              {/* Mobile Card List (< md) */}
              <div className="divide-y divide-gold/10 md:hidden">
                {subscribers.map((s) => (
                  <div
                    key={s._id}
                    className="p-4 space-y-2 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <FiMail className="text-brand/40 shrink-0" size={14} />
                        <span className="font-medium text-brand text-xs truncate">
                          {s.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-brand/50 pl-5">
                        <FiCalendar size={12} />
                        <span>
                          {new Date(s.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubscriber(s._id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      aria-label="Remove subscriber"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gold/15 bg-ivory/30 text-brand/60 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-3 px-6">Email Address</th>
                      <th className="py-3 px-4">Subscribed Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {subscribers.map((s) => (
                      <tr
                        key={s._id}
                        className="hover:bg-ivory/20 transition-colors"
                      >
                        <td className="py-3.5 px-6 font-medium text-brand">
                          {s.email}
                        </td>
                        <td className="py-3.5 px-4 text-brand/60">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubscriber(s._id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove subscriber"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Email Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-gold/20">
            <div className="flex items-center justify-between pb-3 border-b border-gold/15">
              <div className="min-w-0 pr-2">
                <h2 className="font-serif text-base sm:text-lg text-brand font-medium">
                  Newsletter Template Preview
                </h2>
                <p className="text-[11px] text-brand/50 mt-0.5 truncate">
                  Subject: <strong className="text-brand">{subject}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-brand/40 hover:text-brand p-1"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Email Frame Simulation */}
            <div className="bg-[#FAF8F5] p-3 sm:p-6 rounded-2xl border border-gold/25">
              <div className="max-w-[540px] mx-auto bg-white rounded-xl border border-gold/20 overflow-hidden shadow-xs">
                {/* Gold accent */}
                <div className="h-1 bg-gradient-to-r from-gold/40 via-clay to-gold/40" />

                {/* Header */}
                <div className="p-4 sm:p-6 text-center border-b border-gold/15">
                  <span className="font-serif text-base sm:text-lg tracking-widest uppercase font-semibold text-brand">
                    COSMETICS STORE
                  </span>
                </div>

                {/* Body Content */}
                <div
                  className="p-4 sm:p-6 text-xs sm:text-sm text-[#1A1A1A] leading-relaxed prose prose-sm max-w-none overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Footer */}
                <div className="bg-[#FAF8F5] p-4 text-center border-t border-gold/15 text-[10px] sm:text-[11px] text-brand/50 space-y-1">
                  <p className="uppercase tracking-wider font-semibold text-clay text-[9px] sm:text-[10px]">
                    100% Genuine Direct Formulation Guarantee
                  </p>
                  <p>
                    © {new Date().getFullYear()} Cosmetics Store. All rights
                    reserved.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-ivory border border-gold/30 rounded-xl text-xs font-semibold text-brand hover:bg-gold/10 transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={sending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 bg-brand text-ivory text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={13} />
                    <span>Send to {subscribers.length} Members</span>
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
