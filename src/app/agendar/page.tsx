"use client";

import { useState, useEffect } from "react";
import { Footer } from "@/components/footer";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: {
    name: string;
  };
}

interface Barber {
  id: string;
  name: string;
  bio: string | null;
}

export default function AgendarPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load services
  useEffect(() => {
    fetch("/api/public/services")
      .then((res) => res.json())
      .then((data) => setServices(data.data || []))
      .catch((err) => console.error("Erro ao carregar serviços:", err));
  }, []);

  // Load barbers when service is selected
  useEffect(() => {
    if (selectedService) {
      fetch(`/api/public/barbers?serviceId=${selectedService}`)
        .then((res) => res.json())
        .then((data) => setBarbers(data.data || []))
        .catch((err) => console.error("Erro ao carregar barbeiros:", err));
    } else {
      setBarbers([]);
      setSelectedBarber("");
    }
  }, [selectedService]);

  // Load available slots when date and barber are selected
  useEffect(() => {
    if (selectedService && selectedBarber && selectedDate) {
      setLoading(true);
      fetch(
        `/api/public/availability?barberId=${selectedBarber}&serviceId=${selectedService}&date=${selectedDate}`
      )
        .then((res) => res.json())
        .then((data) => {
          setAvailableSlots(data.slots || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erro ao carregar horários:", err);
          setAvailableSlots([]);
          setLoading(false);
        });
    } else {
      setAvailableSlots([]);
      setSelectedTime("");
    }
  }, [selectedService, selectedBarber, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !selectedService ||
      !selectedBarber ||
      !selectedDate ||
      !selectedTime ||
      !clientName ||
      !clientPhone
    ) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          barberId: selectedBarber,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar agendamento");
      }

      setSuccess(true);
      // Reset form
      setSelectedService("");
      setSelectedBarber("");
      setSelectedDate("");
      setSelectedTime("");
      setClientName("");
      setClientPhone("");
      setAvailableSlots([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find((s) => s.id === selectedService);

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
            Agendar Horário
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Escolha o serviço, barbeiro e horário desejado
          </p>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              <strong>Sucesso!</strong> Seu agendamento foi realizado. Entraremos
              em contato para confirmar.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              <strong>Erro:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            {/* Service Selection */}
            <div className="mb-6">
              <label
                htmlFor="service"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Serviço *
              </label>
              <select
                id="service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R$ {Number(service.price).toFixed(2)} (
                    {service.duration} min)
                  </option>
                ))}
              </select>
              {selectedServiceData && (
                <p className="text-sm text-gray-500 mt-1">
                  Categoria: {selectedServiceData.category.name}
                </p>
              )}
            </div>

            {/* Barber Selection */}
            <div className="mb-6">
              <label
                htmlFor="barber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Barbeiro *
              </label>
              <select
                id="barber"
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedService || barbers.length === 0}
                required
              >
                <option value="">
                  {selectedService
                    ? barbers.length === 0
                      ? "Carregando barbeiros..."
                      : "Selecione um barbeiro"
                    : "Primeiro selecione um serviço"}
                </option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                    {barber.bio ? ` - ${barber.bio.substring(0, 50)}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Data *
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedBarber}
                required
              />
            </div>

            {/* Time Selection */}
            <div className="mb-6">
              <label
                htmlFor="time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Horário *
              </label>
              {loading && selectedDate && (
                <p className="text-sm text-gray-500 mb-2">
                  Carregando horários disponíveis...
                </p>
              )}
              {!loading && selectedDate && availableSlots.length === 0 && (
                <p className="text-sm text-red-600 mb-2">
                  Não há horários disponíveis para esta data.
                </p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedTime === slot
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-amber-500 hover:bg-amber-50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-6">
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Seu Nome *
              </label>
              <input
                type="text"
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="João Silva"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="clientPhone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Telefone *
              </label>
              <input
                type="tel"
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Processando..." : "Confirmar Agendamento"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
