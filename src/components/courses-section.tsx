"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { CourseCard, type CourseCardData } from "@/components/course-card";

export function CoursesSection() {
  const [courses, setCourses] = useState<CourseCardData[]>([]);

  useEffect(() => {
    fetch("/api/public/courses")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json?.data) setCourses(json.data); })
      .catch(() => {});
  }, []);

  if (courses.length === 0) return null;

  return (
    <section id="cursos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Cursos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Aprenda com a gente
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 6).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/cursos"
            className="inline-flex items-center gap-2 border border-gold text-gold px-6 py-3 text-sm uppercase tracking-widest font-heading hover:bg-gold hover:text-background-primary transition-colors duration-200"
          >
            Ver todos os cursos
          </Link>
        </div>
      </div>
    </section>
  );
}
