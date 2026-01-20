"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Barber = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  isActive: boolean;
  _count?: {
    availability: number;
    bookings: number;
  };
};

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      const response = await fetch("/api/admin/barbers");
      if (response.ok) {
        const data = await response.json();
        setBarbers(data);
      }
    } catch (error) {
      console.error("Error loading barbers:", error);
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
        <h1 className="text-2xl font-bold text-gray-900">Barbeiros</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerenciamento de barbeiros e suas disponibilidades
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Barbeiros
            </h2>
            <p className="text-sm text-gray-600">
              {barbers.length} barbeiros cadastrados
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Novo Barbeiro
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-lg font-semibold text-blue-600">
                    {barber.name.charAt(0)}
                  </span>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    barber.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {barber.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                {barber.name}
              </h3>

              {barber.email && (
                <p className="mt-1 text-sm text-gray-600">{barber.email}</p>
              )}

              {barber.phone && (
                <p className="mt-1 text-sm text-gray-600">{barber.phone}</p>
              )}

              {barber.bio && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {barber.bio}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {barber._count?.availability || 0} disponibilidades
                </span>
                <span>{barber._count?.bookings || 0} agendamentos</span>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                  Editar
                </button>
                <button className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Disponibilidade
                </button>
              </div>
            </div>
          ))}
        </div>

        {barbers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum barbeiro cadastrado</p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Cadastrar Primeiro Barbeiro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
