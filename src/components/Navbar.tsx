"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { AuthModal } from "@/components/AuthModal";
import { CartDrawer } from "@/components/CartDrawer";
import { SuccessToast } from "@/components/SuccessToast";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#menu", label: "Menu" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ivory-dark/60 bg-ivory/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="#home"
            className="section-heading text-lg font-semibold tracking-tight text-maroon sm:text-xl"
          >
            Renuka&apos;s Art Collection
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-text-primary transition-colors hover:text-maroon"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-ivory-dark bg-white px-3 py-1.5 transition-all hover:border-maroon/30 hover:shadow-soft"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate text-sm font-medium text-text-primary">
                    {user.name}
                  </span>
                </button>
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-ivory-dark bg-white py-2 shadow-card">
                      <p className="border-b border-ivory-dark px-4 py-2 text-xs text-text-muted">
                        {user.email}
                      </p>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary transition-colors hover:bg-ivory-dark hover:text-maroon border-b border-ivory-dark/40"
                        >
                          <Shield className="h-4 w-4 text-maroon" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary transition-colors hover:bg-ivory-dark hover:text-maroon"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-maroon transition-colors hover:bg-maroon/5"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-xl bg-maroon px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-maroon-dark"
                >
                  Sign Up
                </button>
              </>
            )}
            <button
              onClick={openCart}
              className="relative rounded-xl border border-ivory-dark bg-white p-2.5 transition-all hover:border-maroon/30 hover:shadow-soft"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag className="h-5 w-5 text-maroon" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-maroon text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={openCart}
              className="relative rounded-lg p-2 text-maroon"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon text-[9px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-maroon"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="border-t border-ivory-dark bg-ivory px-4 py-6 md:hidden animate-fade-in">
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-base font-medium text-text-primary hover:text-maroon"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 border-t border-ivory-dark pt-6">
              {isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon text-white">
                      <User className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-text-primary">{user.name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                  </div>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold/10 border border-gold/30 py-3 text-sm font-semibold text-maroon hover:bg-gold/20"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-ivory-dark py-3 text-sm font-medium text-text-primary hover:bg-ivory-dark"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("login")}
                    className="w-full rounded-xl border border-maroon py-3 text-sm font-medium text-maroon"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="w-full rounded-xl bg-maroon py-3 text-sm font-medium text-white"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={setSuccessMessage}
        initialMode={authMode}
      />
      <CartDrawer />
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </>
  );
}
