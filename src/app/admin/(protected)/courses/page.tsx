"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

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
          {courses.map((course) => (
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
                  R$ {course.price.toFixed(2)}
                </span>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                  Editar
                </button>
                <button className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {course.isActive ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
