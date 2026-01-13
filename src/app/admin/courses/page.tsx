"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Course = {
  id: number;
  title: string;
  description: string;
  duration: number;
  price: number;
  maxStudents: number;
  status: "ATIVO" | "INATIVO";
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
          Gerenciamento de cursos oferecidos
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h3>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    course.status === "ATIVO"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {course.status === "ATIVO" ? "Ativo" : "Inativo"}
                </span>
              </div>

              {course.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {course.description}
                </p>
              )}

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Duração</p>
                  <p className="text-sm font-medium text-gray-900">
                    {course.duration}h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Máx. Alunos</p>
                  <p className="text-sm font-medium text-gray-900">
                    {course.maxStudents}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preço</p>
                  <p className="text-sm font-medium text-gray-900">
                    R$ {course.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                  Editar
                </button>
                <button className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Inscrições
                </button>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum curso cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
