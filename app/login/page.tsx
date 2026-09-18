"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../../lib/authContext";

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      // Verify the authenticated account has admin privileges
      if (loggedInUser?.role !== "admin") {
        await logout();
        setError(
          "Access denied. This console requires administrator privileges.",
        );
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please verify your administrator credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-ivory/40">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white border border-gold/25 rounded-3xl p-8 sm:p-10 shadow-xl shadow-brand/5 relative overflow-hidden">
          {/* Top Gold & Clay Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold/30 via-clay to-gold/30" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand text-ivory flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FiShield size={22} className="text-gold" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay block mb-1">
              Cosmetics Atelier
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-brand font-normal tracking-tight">
              Administrative Suite
            </h1>
            <p className="text-xs text-brand/60 mt-1.5">
              Enter your elevated credentials to enter the management console
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50/90 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-800">
              <FiAlertCircle
                size={16}
                className="text-rose-500 shrink-0 mt-0.5"
              />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-[11px] uppercase tracking-wider text-brand/70 font-semibold mb-1.5"
              >
                Admin Identifier / Email
              </label>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 text-brand/40" size={16} />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@atelier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-ivory/30 border border-gold/30 rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-[11px] uppercase tracking-wider text-brand/70 font-semibold"
                >
                  Password
                </label>
              </div>

              <div className="relative flex items-center">
                <FiLock className="absolute left-3.5 text-brand/40" size={16} />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-ivory/30 border border-gold/30 rounded-xl text-xs sm:text-sm text-brand placeholder:text-brand/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-brand/40 hover:text-brand transition-colors p-1"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand text-ivory text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-brand/90 hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Enter Console</span>
                  <FiArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Badge Footnote */}
        <p className="text-center text-[11px] text-brand/40 mt-4 tracking-wider uppercase">
          Authorized personnel only • All access attempts logged
        </p>
      </div>
    </div>
  );
}
