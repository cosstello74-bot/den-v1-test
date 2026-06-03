import type { MetadataRoute } from "next";
import { getAllCategories }    from "@/lib/category";
import generatedPagesData      from "@/data/ael/generated-pages.json";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://den-v1.vercel.app";

const TRAFFIC_SEEDING_SLUGS = [
  "best-laptops-for-gaming",
  "best-laptops-for-students",
  "best-budget-laptops",
  "laptops-for-coding",
  "work-from-home-laptops",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static routes ─────────────────────────────────────────────────────────
  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/quiz`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/results`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // ── GEO category root pages /[slug] ───────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = getAllCategories().map((slug) => ({
    url:             `${BASE_URL}/${slug}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.9,
  }));

  // ── Traffic seeding pages /[slug] ─────────────────────────────────────────
  const seedingRoutes: MetadataRoute.Sitemap = TRAFFIC_SEEDING_SLUGS.map((slug) => ({
    url:             `${BASE_URL}/${slug}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.85,
  }));

  // ── AEL-generated pages /generated/[slug] ────────────────────────────────
  const aelRoutes: MetadataRoute.Sitemap = generatedPagesData.pages.map((p) => ({
    url:             `${BASE_URL}/generated/${p.slug}`,
    lastModified:    new Date(p.createdAt),
    changeFrequency: "weekly" as const,
    priority:        0.80,
  }));

  return [...statics, ...categoryRoutes, ...seedingRoutes, ...aelRoutes];
}
