"use client";

import { useEffect, useState } from "react";
import { products as staticProducts } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types";
import { Loader } from "lucide-react";

export function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_available", true)
          .order("created_at", { ascending: false });

        if (error) {
          if (error.message.includes("not find the table") || error.message.includes("does not exist")) {
            console.warn("Products table is not yet created in Supabase. Falling back to static showcase products.");
          } else {
            console.error("Supabase products query error:", error.message);
          }
          setProducts(staticProducts);
          return;
        }

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(staticProducts);
        }
      } catch (err) {
        console.warn("Failed to load products from database, falling back to static:", err);
        setProducts(staticProducts);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <section id="menu" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Our Collection
          </p>
          <h2 className="section-heading mb-4 text-3xl font-bold text-maroon sm:text-4xl">
            Handpainted Masterpieces
          </h2>
          <p className="mx-auto max-w-2xl text-text-muted">
            Each piece in our collection is a unique work of art, handpainted
            with love and precision. Browse our signature sarees and ethnic wear.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-maroon" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
