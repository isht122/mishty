import { Product } from "@/types";

export const products: Product[] = Array.from({ length: 13 }, (_, i) => ({
  id: `product-${String(i + 1).padStart(2, "0")}`,
  image: `/images/products/product-${String(i + 1).padStart(2, "0")}.jpeg`,
}));

export const HERO_IMAGE = "/images/products/product-01.jpeg";
