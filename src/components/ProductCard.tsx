"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Zap } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [actionMode, setActionMode] = useState<"cart" | "buy">("cart");
  const { addToCart } = useCart();

  const handleAction = () => {
    addToCart(product.id, product.image);
  };

  const imageSrc = product.image && product.image.trim() !== "" ? product.image : "/images/products/product-01.jpeg";

  return (
    <article className="group overflow-hidden rounded-2xl border border-ivory-dark bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={imageSrc}
          alt="Handpainted saree"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="p-5">
        {product.name && (
          <h3 className="section-heading mb-3 text-base font-bold text-maroon line-clamp-1">
            {product.name}
          </h3>
        )}
        <div className="mb-4 min-h-[60px] space-y-2">
          <div className="rounded-lg border border-dashed border-ivory-dark bg-ivory/50 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Description
            </p>
            <p className="mt-0.5 text-sm text-text-muted/70 italic">
              {product.description || "To be added by admin"}
            </p>
          </div>
          <div className="rounded-lg border border-dashed border-ivory-dark bg-ivory/50 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Price
            </p>
            <p className="mt-0.5 text-sm text-text-muted/70 italic">
              {product.price || "To be added by admin"}
            </p>
          </div>
        </div>

        <div className="mb-3 flex rounded-xl border border-ivory-dark p-1">
          <button
            onClick={() => setActionMode("cart")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm ${
              actionMode === "cart"
                ? "bg-maroon text-white shadow-sm"
                : "text-text-muted hover:text-maroon"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
          <button
            onClick={() => setActionMode("buy")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm ${
              actionMode === "buy"
                ? "bg-maroon text-white shadow-sm"
                : "text-text-muted hover:text-maroon"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Buy Now
          </button>
        </div>

        <button
          onClick={handleAction}
          className="w-full rounded-xl bg-maroon py-3 text-sm font-semibold text-white transition-all hover:bg-maroon-dark"
        >
          {actionMode === "buy" ? "Buy Now" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
