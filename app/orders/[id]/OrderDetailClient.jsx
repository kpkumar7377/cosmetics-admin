"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiTruck,
  FiArrowLeft,
  FiPackage,
  FiMapPin,
  FiClock,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiAlertCircle,
  FiCreditCard,
  FiUser,
  FiCheckCircle,
  FiRotateCcw,
  FiX,
  FiEye,
} from "react-icons/fi";
import api from "../../../lib/api";

const STATUSES = [
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_requested", label: "Return Requested" },
  { value: "return_approved", label: "Return Approved" },
  { value: "return_rejected", label: "Return Rejected" },
  { value: "returned", label: "Returned & Refunded" },
];

const statusStyles = {
  placed: {
    badge: "bg-amber-50 text-amber-800 border-amber-200/70",
    dot: "bg-amber-500",
  },
  confirmed: {
    badge: "bg-blue-50 text-blue-800 border-blue-200/70",
    dot: "bg-blue-500",
  },
  shipped: {
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
    dot: "bg-indigo-500",
  },
  delivered: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  cancelled: {
    badge: "bg-rose-50 text-rose-800 border-rose-200/70",
    dot: "bg-rose-500",
  },
  return_requested: {
    badge: "bg-orange-50 text-orange-800 border-orange-200/70",
    dot: "bg-orange-500",
  },
  return_approved: {
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200/70",
    dot: "bg-cyan-500",
  },
  return_rejected: {
    badge: "bg-rose-50 text-rose-800 border-rose-200/70",
    dot: "bg-rose-500",
  },
  returned: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
};

export default function OrderDetailClient({ id }) {
  const [order, setOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [error, setError] = useState("");

  // Return & Refund handling state
  const [reviewingReturn, setReviewingReturn] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [releasingRefund, setReleasingRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    refundAmount: "",
    referenceId: "",
    adminNotes: "",
  });
  const [refundErrors, setRefundErrors] = useState({});

  const load = () => {
    return api
      .get(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
        if (res.data) {
          setRefundForm((prev) => ({
            ...prev,
            refundAmount: String(res.data.total),
          }));
        }
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load order"),
      );
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleShip = async () => {
    setShipping(true);
    try {
      await api.post(`/shipments/${id}/create`);
      await load();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to create shipment — check Shiprocket credentials in .env",
      );
    } finally {
      setShipping(false);
    }
  };

  // Admin approves return -> creates reverse pickup on Shiprocket
  const handleReviewReturn = async (action) => {
    let rejectReason = "";
    if (action === "reject") {
      const reasonInput = prompt("Enter specific reason for rejecting return:");
      if (reasonInput === null) return; // User clicked Cancel
      rejectReason = reasonInput.trim();
      if (!rejectReason) {
        alert("A valid rejection reason is required.");
        return;
      }
    }

    setReviewingReturn(true);
    try {
      await api.patch(`/orders/${id}/return-review`, {
        action,
        rejectReason,
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process return review");
    } finally {
      setReviewingReturn(false);
    }
  };

  const validateRefundForm = () => {
    const errs = {};
    const amount = Number(refundForm.refundAmount);

    if (!refundForm.refundAmount || isNaN(amount) || amount <= 0) {
      errs.refundAmount = "Refund amount must be greater than ₹0.";
    } else if (order && amount > Number(order.total)) {
      errs.refundAmount = `Refund cannot exceed the order total of ₹${order.total}.`;
    }

    if (!refundForm.referenceId || !refundForm.referenceId.trim()) {
      errs.referenceId = "Bank UTR or transaction reference is required.";
    } else if (refundForm.referenceId.trim().length < 5) {
      errs.referenceId = "Reference ID should be at least 5 characters.";
    }

    setRefundErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Admin releases netbanking refund
  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!validateRefundForm()) return;

    setReleasingRefund(true);
    try {
      await api.post(`/orders/${id}/process-refund`, {
        refundAmount: Number(refundForm.refundAmount),
        referenceId: refundForm.referenceId.trim(),
        adminNotes: refundForm.adminNotes.trim(),
      });
      setShowRefundModal(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record refund release.");
    } finally {
      setReleasingRefund(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 sm:my-16 p-6 sm:p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs">
        <FiAlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
        <h2 className="font-serif text-lg text-brand mb-1">
          Unable to Load Order
        </h2>
        <p className="text-xs text-brand/60 mb-5">{error}</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-ivory text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-brand/90 transition-colors"
        >
          <FiArrowLeft size={13} /> Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-brand/10 rounded" />
        <div className="h-10 w-64 bg-brand/10 rounded-xl" />
        <div className="h-48 bg-white/70 border border-gold/15 rounded-2xl" />
      </div>
    );
  }

  const isCod = order.payment?.method === "cod";
  const isPaid = order.payment?.status === "paid";
  const canShip = isCod || isPaid;
  const currentStatusStyle = statusStyles[order.status] || statusStyles.placed;
  const subtotal =
    order.items?.reduce((sum, item) => sum + item.price * item.qty, 0) || 0;

  const isReturnRequestedByUser =
    [
      "return_requested",
      "return_approved",
      "return_rejected",
      "returned",
    ].includes(order.status) && Boolean(order.returnRequest?.reason);

  const returnReq = order.returnRequest;

  const hasRefundBeenReleased =
    returnReq?.refund &&
    typeof returnReq.refund.amount === "number" &&
    !isNaN(returnReq.refund.amount) &&
    returnReq.refund.amount > 0;

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand/60 hover:text-clay transition-colors mb-2"
          >
            <FiArrowLeft size={14} /> Back to Orders
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${currentStatusStyle.badge}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${currentStatusStyle.dot}`}
              />
              <span className="capitalize">
                {order.status.replace("_", " ")}
              </span>
            </span>
          </div>
        </div>

        {/* State Selection Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-gold/30 rounded-xl px-3.5 py-2 shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand/60 shrink-0">
            State:
          </span>
          <select
            value={order.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-transparent text-xs font-semibold uppercase tracking-wider text-brand focus:outline-none cursor-pointer w-full sm:w-auto text-right sm:text-left"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Return & Refund Admin Control Desk */}
      {isReturnRequestedByUser && (
        <div className="bg-white border border-clay/30 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/15 pb-3">
            <h2 className="font-serif text-base sm:text-lg text-brand font-medium flex items-center gap-2">
              <FiRotateCcw className="text-clay shrink-0" /> Return & Refund
              Request Details
            </h2>
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                returnReq.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : returnReq.status === "approved"
                    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                    : returnReq.status === "rejected"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {returnReq.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-brand">Reason for Return:</p>
              <p className="text-brand/80">{returnReq.reason}</p>
              {returnReq.notes && (
                <p className="text-brand/60 pt-1 whitespace-pre-wrap">
                  {returnReq.notes}
                </p>
              )}

              {/* Uploaded Customer Verification Photos */}
              {returnReq.photos && returnReq.photos.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gold/15">
                  <p className="font-semibold text-brand mb-1.5 flex items-center gap-1">
                    <FiEye className="text-clay shrink-0" /> Customer
                    Verification Images:
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {returnReq.photos.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gold/30 shadow-2xs hover:border-clay transition-all block"
                        title="Click to view full image"
                      >
                        <img
                          src={img}
                          alt={`inspection-${i}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <FiExternalLink size={14} />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Bank Account for Netbanking Transfer */}
            <div className="bg-ivory/50 border border-gold/25 p-3.5 sm:p-4 rounded-xl space-y-1.5">
              <p className="font-semibold text-brand text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <FiCreditCard className="text-clay shrink-0" /> Refund
                Beneficiary Details
              </p>
              {returnReq.bankAccount ? (
                <div className="space-y-1 text-xs">
                  <p className="truncate">
                    <span className="text-brand/60">A/C Holder:</span>{" "}
                    <strong>{returnReq.bankAccount.accountHolderName}</strong>
                  </p>
                  <p className="font-mono truncate">
                    <span className="text-brand/60">Account No:</span>{" "}
                    <strong>{returnReq.bankAccount.accountNumber}</strong>
                  </p>
                  <p className="font-mono">
                    <span className="text-brand/60">IFSC Code:</span>{" "}
                    <strong>{returnReq.bankAccount.ifscCode}</strong>
                  </p>
                  {returnReq.bankAccount.bankName && (
                    <p className="truncate">
                      <span className="text-brand/60">Bank Name:</span>{" "}
                      {returnReq.bankAccount.bankName}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-rose-600">No bank details recorded.</p>
              )}
            </div>
          </div>

          {/* Action Row for Admin */}
          <div className="pt-3 border-t border-gold/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {order.status === "return_requested" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleReviewReturn("approve")}
                    disabled={reviewingReturn}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand text-ivory text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50"
                  >
                    <FiCheck size={14} />
                    <span>
                      {reviewingReturn
                        ? "Connecting Shiprocket..."
                        : "Approve & Book Pickup"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewReturn("reject")}
                    disabled={reviewingReturn}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50"
                  >
                    <FiX size={14} />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {/* Show Reverse Pickup AWB if generated */}
              {returnReq.reverseAwb && (
                <div className="flex items-center gap-2 text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 px-3 py-1.5 rounded-xl font-mono">
                  <span>Reverse AWB: {returnReq.reverseAwb}</span>
                </div>
              )}
            </div>

            {/* Release Refund Button */}
            {["return_approved", "return_requested", "delivered"].includes(
              order.status,
            ) &&
              returnReq.status !== "completed" && (
                <button
                  type="button"
                  onClick={() => {
                    setRefundErrors({});
                    setShowRefundModal(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <FiCheckCircle size={14} />
                  <span>Release Netbanking Refund</span>
                </button>
              )}
          </div>

          {/* Completed Refund Summary */}
          {hasRefundBeenReleased && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 sm:p-4 rounded-xl text-xs space-y-1 text-emerald-900 animate-in fade-in">
              <p className="font-semibold text-sm">
                Refund Released ({returnReq.refund.type} refund)
              </p>
              <p>
                Amount Transferred:{" "}
                <strong>
                  ₹{Number(returnReq.refund.amount).toLocaleString("en-IN")}
                </strong>
              </p>
              <p className="font-mono truncate">
                Bank UTR / Reference ID: {returnReq.refund.referenceId}
              </p>
              {returnReq.refund.adminNotes && (
                <p className="text-emerald-800">
                  Notes: {returnReq.refund.adminNotes}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Products Card */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs">
            <h2 className="font-serif text-lg text-brand font-medium tracking-tight mb-4 flex items-center gap-2">
              <FiPackage className="text-clay" /> Ordered Products (
              {order.items?.length || 0})
            </h2>

            <div className="divide-y divide-gold/10">
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-ivory border border-gold/25 overflow-hidden flex items-center justify-center shrink-0 text-brand/30">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiPackage size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-brand truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-brand/50 mt-0.5">
                        Qty: {item.qty} &times; ₹
                        {Number(item.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <span className="font-serif text-xs sm:text-sm font-semibold text-brand whitespace-nowrap">
                    ₹{Number(item.price * item.qty).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gold/15 space-y-2 text-xs">
              <div className="flex justify-between text-brand/70">
                <span>Subtotal</span>
                <span className="font-mono">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-brand/70">
                <span>Shipping Fee</span>
                <span className="font-mono">
                  {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-serif text-sm sm:text-base font-semibold text-brand pt-3 border-t border-gold/15">
                <span>Total Invoice</span>
                <span className="text-base sm:text-lg">
                  ₹{Number(order.total).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Profile Card */}
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs">
            <h2 className="font-serif text-lg text-brand font-medium tracking-tight mb-4 flex items-center gap-2">
              <FiCreditCard className="text-clay" /> Payment Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="bg-ivory/40 border border-gold/20 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-brand/50 block">
                  Method
                </span>
                <p className="font-semibold text-brand uppercase">
                  {isCod ? "Cash on Delivery (COD)" : "Online / Razorpay"}
                </p>
              </div>
              <div className="bg-ivory/40 border border-gold/20 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-brand/50 block">
                  Status
                </span>
                <p className="font-semibold text-brand capitalize">
                  {order.payment?.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Logistics & Delivery Destination */}
        <div className="space-y-6">
          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg text-brand font-medium tracking-tight flex items-center gap-2">
              <FiTruck className="text-clay" /> Logistics Fulfillment
            </h3>

            {order.shipment?.awbCode ? (
              <div className="space-y-3 bg-ivory/40 border border-gold/20 rounded-xl p-3.5 sm:p-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-brand/60">AWB Code</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-brand truncate max-w-[140px]">
                      {order.shipment.awbCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.shipment.awbCode)}
                      className="text-brand/40 hover:text-brand transition-colors p-1"
                      title="Copy AWB Code"
                    >
                      {copiedAwb ? (
                        <FiCheck size={14} className="text-emerald-600" />
                      ) : (
                        <FiCopy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleShip}
                disabled={shipping || !canShip}
                className="w-full py-3 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-brand/90 transition-all disabled:opacity-40"
              >
                {shipping ? "Creating Shipment..." : "Ship via Shiprocket"}
              </button>
            )}
          </div>

          <div className="bg-white border border-gold/25 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg text-brand font-medium tracking-tight flex items-center gap-2">
              <FiMapPin className="text-clay" /> Shipping Destination
            </h3>
            <div className="text-xs space-y-1 text-brand/80 leading-relaxed bg-ivory/30 border border-gold/20 p-4 rounded-xl">
              <p className="font-semibold text-brand">
                {order.shippingAddress?.name}
              </p>
              <p>{order.shippingAddress?.line1}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                {order.shippingAddress?.pincode}
              </p>
              <p className="pt-2 text-brand/60">
                Phone: {order.shippingAddress?.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Release Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-gold/20">
            <div className="flex items-center justify-between pb-3 border-b border-gold/15">
              <h2 className="font-serif text-base sm:text-lg text-brand font-medium flex items-center gap-2">
                <FiCreditCard className="text-emerald-700 shrink-0" /> Release
                Netbanking Refund
              </h2>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-brand/40 hover:text-brand p-1"
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <form
              onSubmit={handleProcessRefund}
              noValidate
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-medium text-brand mb-1">
                  Refund Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={order.total}
                  value={refundForm.refundAmount}
                  onChange={(e) => {
                    setRefundForm({
                      ...refundForm,
                      refundAmount: e.target.value,
                    });
                    if (refundErrors.refundAmount) {
                      setRefundErrors((prev) => ({
                        ...prev,
                        refundAmount: null,
                      }));
                    }
                  }}
                  className={`w-full border rounded-xl px-3.5 py-2.5 sm:py-2 text-xs bg-ivory/30 outline-none transition-all ${
                    refundErrors.refundAmount
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-gold/30 focus:border-brand"
                  }`}
                />
                {refundErrors.refundAmount ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {refundErrors.refundAmount}
                  </p>
                ) : (
                  <p className="text-[10px] text-brand/50 mt-1">
                    Total Order Value: ₹{order.total}. Enter a lower amount for
                    partial refund.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-brand mb-1">
                  Bank UTR / Transaction Reference Number{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="e.g. UTR128391290312"
                  required
                  value={refundForm.referenceId}
                  onChange={(e) => {
                    setRefundForm({
                      ...refundForm,
                      referenceId: e.target.value,
                    });
                    if (refundErrors.referenceId) {
                      setRefundErrors((prev) => ({
                        ...prev,
                        referenceId: null,
                      }));
                    }
                  }}
                  className={`w-full border rounded-xl px-3.5 py-2.5 sm:py-2 text-xs bg-ivory/30 outline-none font-mono transition-all ${
                    refundErrors.referenceId
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-gold/30 focus:border-brand"
                  }`}
                />
                {refundErrors.referenceId && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {refundErrors.referenceId}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-brand mb-1">
                  Admin Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on condition, courier fee deduction, etc."
                  value={refundForm.adminNotes}
                  onChange={(e) =>
                    setRefundForm({
                      ...refundForm,
                      adminNotes: e.target.value,
                    })
                  }
                  className="w-full border border-gold/30 rounded-xl px-3.5 py-2 text-xs bg-ivory/30 outline-none focus:border-brand transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="order-2 sm:order-1 flex-1 py-2.5 bg-ivory border border-gold/30 rounded-xl text-brand font-medium hover:bg-gold/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={releasingRefund}
                  className="order-1 sm:order-2 flex-1 py-2.5 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                >
                  {releasingRefund ? "Recording..." : "Confirm Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
