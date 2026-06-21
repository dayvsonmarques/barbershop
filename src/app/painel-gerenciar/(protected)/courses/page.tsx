"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";

const PAGE_SIZE = 12;

type Course = {
  id: number;
  name: string;
  description: string | null;
  type: "PRESENCIAL" | "ONLINE";
  durationHours: number;
  price: number;
  isActive: boolean;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const paginated = useMemo(() => courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [courses, page]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerenciamento de cursos e treinamentos
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Cursos
            </h2>
            <p className="text-sm text-gray-600">
              {courses.length} cursos cadastrados
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Novo Curso
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((course) => (
            <div
              key={course.id}
              className="rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {course.type === "PRESENCIAL" ? "Presencial" : "Online"}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    course.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {course.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>

              {course.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{course.durationHours}h</span>
                <span className="font-semibold text-gray-900">
                  R$ {Number(course.price).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-1 pt-1">
                <IconButton tooltip="Editar">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </IconButton>
                <IconButton tooltip={course.isActive ? "Desativar" : "Ativar"} variant={course.isActive ? "warning" : "success"}>
                  {course.isActive
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20 6L9 17l-5-5"/></svg>
                  }
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Pagination page={page} totalPages={Math.ceil(courses.length / PAGE_SIZE)} total={courses.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}
