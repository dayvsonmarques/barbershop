export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CourseCard, courseTypeLabel } from "@/components/course-card";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { courseIdFromSlug, courseSlug } from "@/lib/slug";
import { formatBRL, getSiteSettings, getSiteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

async function getCourse(slug: string) {
  const id = courseIdFromSlug(slug);
  if (!id) return null;
  return prisma.course.findFirst({ where: { id, isActive: true } });
}

function whatsappLink(phone: string, courseName: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  const text = encodeURIComponent(`Olá! Tenho interesse no curso "${courseName}".`);
  return `https://wa.me/${digits}?text=${text}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};
  const description = course.description?.slice(0, 160) ?? `Curso ${courseTypeLabel[course.type].toLowerCase()} de ${course.durationHours}h.`;
  const path = `/cursos/${courseSlug(course)}`;
  return {
    title: course.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: course.name,
      description,
      url: path,
      images: course.imageUrl ? [course.imageUrl] : undefined,
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  // Mantém uma única URL por curso (ex.: nome alterado no admin)
  const canonicalSlug = courseSlug(course);
  if (slug !== canonicalSlug) permanentRedirect(`/cursos/${canonicalSlug}`);

  const [settings, others] = await Promise.all([
    getSiteSettings(),
    prisma.course.findMany({
      where: { isActive: true, id: { not: course.id } },
      select: { id: true, name: true, description: true, type: true, durationHours: true, imageUrl: true },
      orderBy: { name: "asc" },
      take: 3,
    }),
  ]);

  const price = Number(course.price);
  const siteUrl = getSiteUrl();
  const siteName = settings?.name ?? "Barbearia";

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description ?? course.name,
    url: `${siteUrl}/cursos/${canonicalSlug}`,
    ...(course.imageUrl && { image: course.imageUrl }),
    provider: { "@type": "Organization", name: siteName, sameAs: siteUrl },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      category: "Paid",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.type === "ONLINE" ? "online" : "onsite",
      courseWorkload: `PT${course.durationHours}H`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Cursos", item: `${siteUrl}/cursos` },
      { "@type": "ListItem", position: 3, name: course.name, item: `${siteUrl}/cursos/${canonicalSlug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <JsonLd data={[courseJsonLd, breadcrumbJsonLd]} />
      <Navbar />

      <article className="max-w-6xl mx-auto px-6 py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-secondary">
          <Link href="/" className="hover:text-gold transition-colors">Início</Link>
          <span className="mx-2">/</span>
          <Link href="/cursos" className="hover:text-gold transition-colors">Cursos</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{course.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {course.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.imageUrl}
              alt={course.name}
              className="w-full aspect-[4/3] object-cover border border-border"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-background-tertiary border border-border flex items-center justify-center">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold/40">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold border border-gold/40 px-2 py-0.5">
                {courseTypeLabel[course.type]}
              </span>
              <span className="text-sm text-text-secondary">Carga horária: {course.durationHours}h</span>
            </div>

            <h1
              className="font-heading text-text-primary mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: "1.1" }}
            >
              {course.name}
            </h1>

            <p className="font-heading text-gold text-3xl mb-8">{formatBRL(price)}</p>

            {settings?.phone && (
              <a
                href={whatsappLink(settings.phone, course.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gold text-text-inverse px-8 py-4 font-heading uppercase tracking-widest hover:bg-gold-light transition-colors duration-200 mb-10"
              >
                Quero me inscrever
              </a>
            )}

            {course.description && (
              <div className="border-t border-border pt-8">
                <h2 className="font-heading text-text-primary text-xl mb-4">Sobre o curso</h2>
                <p className="text-text-secondary text-lg leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-24">
            <h2 className="font-heading text-text-primary text-2xl mb-8">Outros cursos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </div>
  );
}
