import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";
import { courseSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/servicos`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/agendar`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/produtos`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/cursos`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const [products, courses] = await Promise.all([
    prisma.product
      .findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
    prisma.course
      .findMany({ where: { isActive: true }, select: { id: true, name: true, updatedAt: true } })
      .catch(() => []),
  ]);

  return [
    ...staticPages,
    ...products.map((p) => ({
      url: `${siteUrl}/produtos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...courses.map((c) => ({
      url: `${siteUrl}/cursos/${courseSlug(c)}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
