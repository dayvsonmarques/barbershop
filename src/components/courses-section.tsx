"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";

type Course = {
  id: number;
  name: string;
  description: string | null;
  type: "PRESENCIAL" | "ONLINE";
  durationHours: number;
  imageUrl: string | null;
};

const typeLabel: Record<string, string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "Online",
};

export function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);

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
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-border bg-background-secondary flex flex-col"
            >
              {course.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.imageUrl}
                  alt={course.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-background-tertiary flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold/40">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold border border-gold/40 px-2 py-0.5">
                    {typeLabel[course.type]}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {course.durationHours}h
                  </span>
                </div>

                <h3 className="font-heading text-text-primary text-lg leading-snug mb-2">
                  {course.name}
                </h3>

                {course.description && (
                  <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 flex-1">
                    {course.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
