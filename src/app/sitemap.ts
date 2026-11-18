import type { MetadataRoute } from "next";

const baseUrl = "https://renuka-3hux.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
  ];
}