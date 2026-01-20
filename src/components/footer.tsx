"use client";

import { useEffect, useMemo, useState } from "react";

type PublicSettings = {
  name?: string;
  openingHours?: Record<string, string>;
  address?: string;
  instagramUrl?: string | null;
  instagramUsername?: string | null;
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/public/settings");
        if (!res.ok) return;
        const json = (await res.json()) as { data?: PublicSettings | null };
        setSettings(json.data ?? null);
      } catch {
        // ignore
      }
    };

    load();
  }, []);

  const addressLines = useMemo(() => {
    const addr = settings?.address ?? "";
    return addr.split("\n").filter(Boolean);
  }, [settings?.address]);

  const hoursSummary = useMemo(() => {
    const openingHours = settings?.openingHours ?? {};
    const monday = openingHours.monday;
    const tuesday = openingHours.tuesday;
    const wednesday = openingHours.wednesday;
    const thursday = openingHours.thursday;
    const friday = openingHours.friday;
    const saturday = openingHours.saturday;

    const week = [monday, tuesday, wednesday, thursday, friday].filter(Boolean);
    const allWeekSame = week.length === 5 && week.every((v) => v === week[0]);

    const lines: string[] = [];
    if (allWeekSame) lines.push(`Seg-Sex: ${week[0]}`);
    if (saturday) lines.push(`Sábado: ${saturday}`);
    if (lines.length === 0) lines.push("Horário não informado");
    return lines;
  }, [settings?.openingHours]);

  const instagramUrl = settings?.instagramUrl ?? "https://instagram.com/edbarbearia";
  const instagramUsername = settings?.instagramUsername ?? "edbarbearia";
  const storeName = settings?.name ?? "ED Barbearia";
  const phoneRaw = (settings as any)?.phone as string | undefined;
  const phoneDigits = (phoneRaw ?? "").replace(/\D/g, "");
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  return (
    <footer className="bg-black text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{storeName}</h3>
            <p className="text-sm">
              Estilo, tradição e qualidade em um só lugar.
            </p>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-4">Dados da loja</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Horário</p>
                {hoursSummary.map((line) => (
                  <p key={line} className="text-gray-300">
                    {line}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-gray-400">Endereço</p>
                {addressLines.length > 0 ? (
                  addressLines.map((line) => (
                    <p key={line} className="text-gray-300">
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-300">Endereço não informado</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-4">Instagram</h3>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-gray-300 transition-colors hover:text-yellow-500"
              aria-label="Instagram"
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-lg font-semibold">@{instagramUsername}</span>
            </a>

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-3 text-gray-300 transition-colors hover:text-yellow-500"
                aria-label="WhatsApp"
              >
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9 9 0 1 0-7.62-4.23L3 21l4.34-1.17A8.96 8.96 0 0 0 12 21Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.2 9.7c.2-.6.4-1 .7-1.3.2-.2.5-.2.8-.1l1.1.4c.2.1.4.3.4.5 0 .3-.1.7-.3 1.1-.2.4-.2.7 0 1.1.4.8 1 1.5 1.8 2 .4.2.7.2 1.1 0 .4-.2.8-.3 1.1-.3.2 0 .4.2.5.4l.4 1.1c.1.3.1.6-.1.8-.3.3-.7.5-1.3.7-.9.3-1.9.1-3-.5-1.6-.8-3-2.2-3.8-3.8-.6-1.1-.8-2.1-.5-3Z"
                  />
                </svg>
                <span className="text-lg font-semibold">WhatsApp</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
          <p>
            &copy; {currentYear} {storeName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
