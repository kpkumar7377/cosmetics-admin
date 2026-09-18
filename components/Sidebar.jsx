"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiBox,
  FiList,
  FiShoppingBag,
  FiImage,
  FiLogOut,
  FiExternalLink,
  FiMail,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../lib/authContext";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/products", label: "Products", icon: FiBox },
  { href: "/categories", label: "Categories", icon: FiList },
  { href: "/orders", label: "Orders", icon: FiShoppingBag },
  { href: "/banners", label: "Hero Banners", icon: FiImage },
  { href: "/newsletter", label: "Newsletter", icon: FiMail },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const userInitial = (
    user?.name?.[0] ||
    user?.email?.[0] ||
    "A"
  ).toUpperCase();

  const renderNavLinks = () => (
    <nav className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setIsOpen(false)}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all duration-150 group ${
              isActive
                ? "bg-brand text-ivory font-semibold shadow-xs"
                : "text-brand/70 hover:text-brand hover:bg-gold/10"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-clay rounded-r-full" />
            )}
            <Icon
              size={17}
              className={
                isActive ? "text-clay" : "text-brand/50 group-hover:text-brand"
              }
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderUserFooter = () => (
    <div className="pt-4 border-t border-gold/20 space-y-3">
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/70 border border-gold/20 shadow-2xs">
        <div className="w-8 h-8 rounded-full bg-brand text-ivory flex items-center justify-center font-serif text-xs font-semibold shrink-0">
          {userInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-brand truncate">
            {user?.name || "Administrator"}
          </p>
          <p className="text-[10px] text-brand/50 font-mono truncate">
            {user?.email || "admin@atelier.com"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          logout();
        }}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-600/80 hover:text-rose-700 hover:bg-rose-50/70 rounded-xl transition-colors group"
      >
        <span className="text-[11px] uppercase tracking-wider font-semibold">
          Terminate Session
        </span>
        <FiLogOut
          size={15}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar (< md screens) */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-ivory/95 backdrop-blur-md border-b border-gold/20 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 -ml-2 rounded-xl text-brand hover:bg-gold/15 transition-colors"
          >
            <FiMenu size={20} />
          </button>

          <Link
            href="/dashboard"
            className="font-serif text-lg tracking-tight text-brand font-normal"
          >
            Cosmetics Atelier
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {process.env.NEXT_PUBLIC_STOREFRONT_URL && (
            <a
              href={process.env.NEXT_PUBLIC_STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View storefront"
              className="p-2 rounded-xl text-brand/60 hover:text-clay transition-colors"
            >
              <FiExternalLink size={16} />
            </a>
          )}
          <div className="w-7 h-7 rounded-full bg-brand text-ivory flex items-center justify-center font-serif text-[11px] font-semibold">
            {userInitial}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Mobile Drawer Sheet */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-ivory border-r border-gold/20 p-5 flex flex-col justify-between shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-gold/15">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-clay block">
                Management Suite
              </span>
              <span className="font-serif text-lg text-brand font-normal">
                Cosmetics Atelier
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="p-1.5 rounded-lg text-brand/60 hover:text-brand hover:bg-gold/15 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {renderNavLinks()}

          {process.env.NEXT_PUBLIC_STOREFRONT_URL && (
            <div className="px-3 pt-1">
              <a
                href={process.env.NEXT_PUBLIC_STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-brand/50 hover:text-clay transition-colors"
              >
                <span>Storefront View</span>
                <FiExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {renderUserFooter()}
      </div>

      {/* Desktop Persistent Sidebar (>= md screens) */}
      <aside className="hidden md:flex w-64 border-r border-gold/20 bg-ivory/50 min-h-screen px-4 py-6 flex-col justify-between shrink-0 select-none sticky top-0 h-screen">
        <div className="space-y-6 overflow-y-auto">
          {/* Brand Header */}
          <div className="px-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-clay">
                Management Suite
              </span>
              <span className="text-[9px] font-mono uppercase bg-gold/15 text-brand/70 px-1.5 py-0.5 rounded border border-gold/25">
                Admin
              </span>
            </div>
            <Link
              href="/dashboard"
              className="font-serif text-xl tracking-tight text-brand font-normal hover:text-clay transition-colors block"
            >
              Cosmetics Atelier
            </Link>
          </div>

          {/* Navigation Links */}
          {renderNavLinks()}

          {/* Storefront External Shortcut */}
          {process.env.NEXT_PUBLIC_STOREFRONT_URL && (
            <div className="px-3 pt-2">
              <a
                href={process.env.NEXT_PUBLIC_STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-brand/50 hover:text-clay transition-colors"
              >
                <span>Storefront View</span>
                <FiExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* User Session & Logout Panel */}
        {renderUserFooter()}
      </aside>
    </>
  );
}
