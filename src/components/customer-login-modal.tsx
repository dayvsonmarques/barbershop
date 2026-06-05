"use client";

import { useState } from "react";
import { useCustomerAuth } from "@/contexts/customer-auth-context";

type Step = "phone" | "otp" | "name";
type Channel = "whatsapp" | "sms";

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function rawPhone(masked: string): string {
  return masked.replace(/\D/g, "");
}

type Props = {
  onClose?: () => void;
};

export function CustomerLoginModal({ onClose }: Props) {
  const { refresh } = useCustomerAuth();

  const [step, setStep] = useState<Step>("phone");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: rawPhone(phone), channel }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar código"); return; }
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent, nameOverride?: string) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: rawPhone(phone), code: otp, name: nameOverride }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Código inválido"); return; }
      if (data.needsName) { setStep("name"); return; }
      await refresh();
      onClose?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitName(e: React.FormEvent) {
    await handleVerifyOtp(e, name);
  }

  const channelLabel = channel === "whatsapp" ? "WhatsApp" : "SMS";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background-primary border border-border w-full max-w-sm mx-4 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(201,168,76,0.15)]">

        <h2 className="font-heading text-text-primary text-2xl mb-1">Entrar</h2>
        <p className="text-text-secondary text-sm mb-6">
          {step === "phone" && "Informe seu número para receber o código de verificação."}
          {step === "otp" && `Código enviado via ${channelLabel} para ${phone}. Digite os 6 dígitos.`}
          {step === "name" && "Primeira vez? Informe seu nome para continuar."}
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            {/* Channel toggle */}
            <div className="flex border border-border text-sm">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex-1 py-2 transition-colors ${
                  channel === "whatsapp"
                    ? "bg-gold text-background-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`flex-1 py-2 transition-colors border-l border-border ${
                  channel === "sms"
                    ? "bg-gold text-background-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                SMS
              </button>
            </div>

            <input
              type="tel"
              placeholder="(81) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              className="w-full border border-border bg-background-secondary text-text-primary px-4 py-3 text-sm focus:outline-none focus:border-gold"
              required
            />
            <button
              type="submit"
              disabled={loading || rawPhone(phone).length < 10}
              className="bg-gold text-background-primary font-heading uppercase tracking-widest py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Enviando..." : `Receber código via ${channelLabel}`}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={(e) => handleVerifyOtp(e)} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border border-border bg-background-secondary text-text-primary px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:border-gold"
              required
            />
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="bg-gold text-background-primary font-heading uppercase tracking-widest py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
              className="text-text-secondary text-xs hover:text-text-primary transition-colors"
            >
              Usar outro número
            </button>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={handleSubmitName} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border bg-background-secondary text-text-primary px-4 py-3 text-sm focus:outline-none focus:border-gold"
              required
            />
            <button
              type="submit"
              disabled={loading || name.trim().length < 1}
              className="bg-gold text-background-primary font-heading uppercase tracking-widest py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Continuar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
