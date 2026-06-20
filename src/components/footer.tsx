// src/components/footer.tsx
"use client";

import { useEffect, useState } from "react";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABEL: Record<string, string> = {
  monday: "Seg", tuesday: "Ter", wednesday: "Qua", thursday: "Qui",
  friday: "Sex", saturday: "Sáb", sunday: "Dom",
};

function formatHourRange(range: string): string {
  const [start, end] = range.split("-");
  const fmt = (t: string) => t.replace(/^0/, "").replace(":00", "h").replace(/:(\d+)/, "h$1");
  return end ? `${fmt(start)} às ${fmt(end)}` : range;
}

function formatOpeningHours(raw?: string): string {
  if (!raw) return "Horário não informado";
  let parsed: Record<string, string>;
  try { parsed = JSON.parse(raw); } catch { return raw; }

  const days = DAY_KEYS.filter((d) => parsed[d]);
  const groups: { days: string[]; hours: string }[] = [];

  for (const day of days) {
    const hours = parsed[day];
    const last = groups[groups.length - 1];
    if (last && last.hours === hours) {
      last.days.push(DAY_LABEL[day]);
    } else {
      groups.push({ days: [DAY_LABEL[day]], hours });
    }
  }

  return groups
    .filter(({ hours }) => hours.toLowerCase() !== "fechado")
    .map(({ days: ds, hours }) => {
      const label = ds.length > 2 ? `${ds[0]} a ${ds[ds.length - 1]}` : ds.join(", ");
      return `${label}: ${formatHourRange(hours)}`;
    })
    .join(" | ");
}

type PublicSettings = {
  name?: string;
  address?: string;
  instagramUrl?: string | null;
  instagramUsername?: string | null;
  openingHours?: string;
  phone?: string | null;
};


export function Footer() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setSettings(json.data as PublicSettings);
      })
      .catch(() => {});
  }, []);

  const storeName = settings?.name ?? "ED Barbearia";
  const instagramUrl =
    settings?.instagramUrl ?? "https://instagram.com/edbarbearia";

  const phoneDigits = (settings?.phone ?? "").replace(/\D/g, "");
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  const hoursSummary = formatOpeningHours(settings?.openingHours);

  return (
    <>
    <div className="group fixed bottom-4 right-4 z-50 m-2.5">
      <span className="pointer-events-none absolute bottom-full right-0 mb-4 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Desenvolvido por Web Dev Studio
      </span>
      <a
        href="https://webdev.recife.br/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Desenvolvido por webdev.recife.br"
        className="flex items-center justify-center w-8 h-8 rotate-45 border transition-colors duration-200
          border-[#C9A84C] hover:bg-[#C9A84C]/10
          dark:border-white dark:hover:border-[#C9A84C]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="-rotate-45 w-4 h-4 text-[#C9A84C] dark:text-white dark:group-hover:text-[#C9A84C] transition-colors duration-200"
        >
          <path d="M8 6L3 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 4.5L9.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 6L21 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
    <footer className="bg-background-primary border-t border-gold/30 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <p className="font-heading text-gold text-2xl font-bold mb-3">
              {storeName}
            </p>
            <p className="text-text-secondary text-lg leading-relaxed">
              Tradição, estilo e precisão em Recife.
            </p>
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mt-4">
              Horário de funcionamento
            </p>
            <p className="text-text-secondary text-lg mt-1">{hoursSummary}</p>
          </div>

          <div>
            <p className="text-text-primary font-semibold uppercase text-base tracking-widest mb-4">
              Redes Sociais
            </p>
            <div className="flex gap-5 items-center">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-gold transition-colors duration-300"
                aria-label="Instagram"
              >
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-gold transition-colors duration-300"
                  aria-label="WhatsApp"
                >
                  <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-text-secondary text-sm text-center">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
