import Link from "next/link";
import { courseSlug } from "@/lib/slug";

export type CourseCardData = {
  id: number;
  name: string;
  description: string | null;
  type: "PRESENCIAL" | "ONLINE";
  durationHours: number;
  imageUrl: string | null;
};

export const courseTypeLabel: Record<CourseCardData["type"], string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "Online",
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/cursos/${courseSlug(course)}`}
      className="group border border-border bg-background-secondary flex flex-col hover:border-gold/60 transition-colors duration-200"
    >
      {course.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.imageUrl}
          alt={course.name}
          loading="lazy"
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
            {courseTypeLabel[course.type]}
          </span>
          <span className="text-xs text-text-secondary">{course.durationHours}h</span>
        </div>

        <h3 className="font-heading text-text-primary text-lg leading-snug mb-2 group-hover:text-gold transition-colors duration-200">
          {course.name}
        </h3>

        {course.description && (
          <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 flex-1">
            {course.description}
          </p>
        )}

        <span className="mt-4 text-gold text-sm uppercase tracking-widest font-heading">
          Ver detalhes →
        </span>
      </div>
    </Link>
  );
}
