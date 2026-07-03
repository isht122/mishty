"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { HERO_IMAGE } from "@/data/products";
import { useCart } from "@/context/CartContext";

export function Hero() {
  const { openCart } = useCart();

  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden pt-20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-ivory via-ivory-dark/50 to-maroon/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
        <div className="animate-fade-in-up order-2 lg:order-1">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Handpainted Wearable Art
          </p>
          <h1 className="section-heading mb-6 text-4xl font-bold leading-tight text-maroon sm:text-5xl lg:text-6xl">
            Because every woman deserves a masterpiece
          </h1>
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-text-muted">
            Make yourself unbeatable and unique with our signature collection.
            Each piece is lovingly handpainted — a celebration of art you can
            wear.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="#menu"
              className="inline-flex items-center rounded-xl bg-maroon px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-maroon-dark hover:shadow-card"
            >
              Explore Menu
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center rounded-xl border-2 border-maroon bg-white px-6 py-3.5 text-sm font-semibold text-maroon transition-all hover:-translate-y-0.5 hover:bg-maroon/5"
            >
              Book Consultation
            </Link>
            <button
              onClick={openCart}
              className="inline-flex items-center gap-2 rounded-xl border border-ivory-dark bg-white px-6 py-3.5 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-maroon/30 hover:shadow-soft"
            >
              <ShoppingBag className="h-4 w-4 text-maroon" />
              Cart
            </button>
          </div>

          <a
            href="https://wa.me/918445944019"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-maroon transition-colors hover:text-maroon-dark"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp: +91 8445944019
          </a>
        </div>

        <div className="animate-fade-in-up order-1 lg:order-2" style={{ animationDelay: "0.15s" }}>
          <div className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden rounded-3xl shadow-card lg:max-w-none">
            <Image
              src={HERO_IMAGE}
              alt="Handpainted yellow saree with floral artwork"
              fill
              priority
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maroon/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
