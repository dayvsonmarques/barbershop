export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SectionLabel } from "@/components/ui/section-label";
import { CourseCard } from "@/components/course-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Cursos",
  description: "Cursos de barbearia presenciais e online: aprenda técnicas de corte, barba e acabamento com profissionais.",
  alternates: { canonical: "/cursos" },
};

export default async function CursosPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true, type: true, durationHours: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-24">
        <SectionLabel label="Cursos" />
        <h1
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Aprenda com a gente
        </h1>
        <p className="text-text-secondary text-lg mb-12 max-w-2xl">
          Cursos presenciais e online para quem quer começar ou se aperfeiçoar na barbearia.
        </p>

        {courses.length === 0 ? (
          <p className="text-text-secondary">Nenhum curso disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
