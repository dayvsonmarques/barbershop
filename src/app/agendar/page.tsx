"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/style.css";
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

const fieldErrorClass =
  "w-full px-4 py-3 bg-background-secondary border border-red-500 text-text-primary focus:outline-none focus:border-red-500 transition-colors duration-200";

const labelClass =
  "block text-text-secondary text-xs tracking-widest uppercase mb-2";

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AgendarPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
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
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    const rawPhone = clientPhone.replace(/\D/g, "");
    if (rawPhone.length < 10 || rawPhone.length > 11) {
      setPhoneError("Telefone inválido. Use o formato (XX) 9XXXX-XXXX.");
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
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4000);
      setSelectedService("");
      setSelectedBarber("");
      setSelectedDate("");
      setSelectedTime("");
      setClientName("");
      setClientPhone("");
      setPhoneError("");
      setAvailableSlots([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 13);

  function dateToStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const selectedDateObj = selectedDate ? new Date(selectedDate + "T00:00:00") : undefined;

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

        {/* Toast de confirmação */}
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background-primary border border-gold px-6 py-4 shadow-lg transition-all duration-300 ${
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-gold font-semibold text-sm tracking-wide whitespace-nowrap">Agendamento confirmado!</p>
        </div>

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
          <div ref={calendarRef} className="relative">
            <label className={labelClass}>Data *</label>
            <button
              type="button"
              onClick={() => selectedBarber && setCalendarOpen((o) => !o)}
              className={`${fieldClass} text-left flex items-center justify-between ${!selectedBarber ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className={selectedDate ? "text-[#18181B]" : "text-[#A1A1AA]"}>
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                  : "Selecione uma data"}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#A1A1AA] shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>

            {calendarOpen && (
              <div className="absolute z-50 mt-1 bg-white border border-[#E5E5E5] shadow-lg p-3">
                <DayPicker
                  locale={ptBR}
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={(day) => {
                    setSelectedDate(day ? dateToStr(day) : "");
                    setSelectedTime("");
                    setCalendarOpen(false);
                  }}
                  disabled={[{ before: today }, { after: maxDate }]}
                  startMonth={today}
                  endMonth={maxDate}
                  classNames={{
                    root: "!font-sans",
                    month_caption: "text-base font-semibold text-[#18181B] mb-2 capitalize",
                    nav: "hidden",
                    button_previous: "hidden",
                    button_next: "hidden",
                    weeks: "border-t border-[#E5E5E5] pt-2",
                    weekdays: "mb-1",
                    weekday: "text-sm font-medium text-[#71717A] w-10 text-center",
                    day: "w-10 h-10 text-base",
                    day_button: "w-10 h-10 text-base rounded-none hover:bg-[#F7F7F8] transition-colors",
                    selected: "[&>button]:bg-[#C9A84C] [&>button]:text-white [&>button]:hover:bg-[#B8963C]",
                    today: "[&>button]:font-bold [&>button]:text-[#C9A84C]",
                    disabled: "opacity-30 pointer-events-none",
                    outside: "opacity-20 pointer-events-none",
                  }}
                />
              </div>
            )}
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
              placeholder="Insira seu nome e sobrenome"
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
              onChange={(e) => {
                setPhoneError("");
                setClientPhone(maskPhone(e.target.value));
              }}
              onBlur={() => {
                const digits = clientPhone.replace(/\D/g, "");
                if (clientPhone && (digits.length < 10 || digits.length > 11)) {
                  setPhoneError("Telefone inválido. Use o formato (XX) 9XXXX-XXXX.");
                }
              }}
              className={phoneError ? fieldErrorClass : fieldClass}
              placeholder="(81) 99999-9999"
              maxLength={15}
              inputMode="numeric"
              autoComplete="tel"
              required
            />
            {phoneError && (
              <p className="mt-1.5 text-xs text-red-500">{phoneError}</p>
            )}
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
