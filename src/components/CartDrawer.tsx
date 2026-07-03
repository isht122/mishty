"use client";

import Image from "next/image";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, itemCount } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div
        className="absolute inset-0 bg-maroon/20 backdrop-blur-sm animate-fade-in"
        onClick={closeCart}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-card animate-fade-in-up"
      >
        <div className="flex items-center justify-between border-b border-ivory-dark px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-maroon" />
            <h2 className="section-heading text-lg font-semibold text-maroon">
              Your Cart ({itemCount})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-ivory-dark hover:text-maroon"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-ivory-dark" />
              <p className="text-text-muted">Your cart is empty</p>
              <p className="mt-1 text-sm text-text-muted/70">
                Explore our collection and add items you love
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex gap-4 rounded-xl border border-ivory-dark p-3 transition-shadow hover:shadow-soft"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.image && item.image.trim() !== "" ? item.image : "/images/products/product-01.jpeg"}
                      alt="Product"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <p className="text-sm font-medium text-text-primary">
                      Handpainted Piece
                    </p>
                    <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="self-start rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ivory-dark px-6 py-5">
            <button
              onClick={closeCart}
              className="w-full rounded-xl bg-maroon py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-dark"
            >
              Proceed to Checkout
            </button>
            <p className="mt-2 text-center text-xs text-text-muted">
              Checkout will be available once backend is connected
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
