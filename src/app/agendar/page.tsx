"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: { name: string };
}

interface Barber {
  id: string;
  name: string;
  bio: string | null;
}

const fieldClass =
  "w-full px-4 py-3 bg-background-secondary border border-border text-text-primary focus:outline-none focus:border-gold transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed";

const labelClass =
  "block text-text-secondary text-xs tracking-widest uppercase mb-2";

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

  useEffect(() => {
    fetch("/api/public/services")
      .then((res) => res.json())
      .then((data) => setServices(data.data || []))
      .catch((err) => console.error("Erro ao carregar serviços:", err));
  }, []);

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
        .catch(() => {
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

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !clientName || !clientPhone) {
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
      if (!response.ok) throw new Error(data.error || "Erro ao criar agendamento");

      setSuccess(true);
      setSelectedService("");
      setSelectedBarber("");
      setSelectedDate("");
      setSelectedTime("");
      setClientName("");
      setClientPhone("");
      setAvailableSlots([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />

      <section className="max-w-2xl mx-auto px-6 py-24">
        <SectionLabel label="Agendamento" />
        <h1
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Agendar Horário
        </h1>
        <p className="text-text-secondary mb-12 leading-relaxed">
          Escolha o serviço, barbeiro e horário desejado.
        </p>

        {success && (
          <div className="border-l-2 border-gold bg-background-secondary px-6 py-4 mb-8">
            <p className="text-gold font-semibold text-sm tracking-wide">Agendamento confirmado</p>
            <p className="text-text-secondary text-sm mt-1">
              Entraremos em contato para confirmar.
            </p>
          </div>
        )}

        {error && (
          <div className="border-l-2 border-red-500 bg-background-secondary px-6 py-4 mb-8">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Serviço */}
          <div>
            <label htmlFor="service" className={labelClass}>Serviço *</label>
            <div className="relative">
              <select
                id="service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
                required
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — R$ {Number(service.price).toFixed(2)} ({service.duration} min)
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {selectedServiceData && (
              <p className="text-text-secondary text-xs mt-2 tracking-wide">
                {selectedServiceData.category.name}
              </p>
            )}
          </div>

          {/* Barbeiro */}
          <div>
            <label htmlFor="barber" className={labelClass}>Barbeiro *</label>
            <div className="relative">
              <select
                id="barber"
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
                disabled={!selectedService}
                required
              >
                <option value="">
                  {!selectedService
                    ? "Primeiro selecione um serviço"
                    : barbers.length === 0
                    ? "Carregando barbeiros..."
                    : "Selecione um barbeiro"}
                </option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Data */}
          <div>
            <label htmlFor="date" className={labelClass}>Data *</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className={fieldClass}
              disabled={!selectedBarber}
              required
            />
          </div>

          {/* Horário */}
          <div>
            <label className={labelClass}>Horário *</label>
            {loading && selectedDate && (
              <p className="text-text-secondary text-sm mb-3">Carregando horários...</p>
            )}
            {!loading && selectedDate && availableSlots.length === 0 && (
              <p className="text-text-secondary text-sm mb-3">
                Nenhum horário disponível para esta data.
              </p>
            )}
            {availableSlots.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 border text-sm transition-colors duration-200 ${
                      selectedTime === slot
                        ? "bg-gold text-text-inverse border-gold"
                        : "bg-background-secondary text-text-secondary border-border hover:border-gold hover:text-text-primary"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="border-t border-border" />

          {/* Nome */}
          <div>
            <label htmlFor="clientName" className={labelClass}>Seu Nome *</label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={fieldClass}
              placeholder="João Silva"
              required
            />
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="clientPhone" className={labelClass}>Telefone *</label>
            <input
              type="tel"
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className={fieldClass}
              placeholder="(81) 99999-9999"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Processando..." : "Confirmar Agendamento"}
          </Button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
